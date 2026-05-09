import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { cookies } from "next/headers";

const dockerCmd = "docker.exe";
const ldapUrl = "ldap://localhost:389";
const baseDN = "dc=aster,dc=cat";
const bindDN = "cn=admin,dc=aster,dc=cat";
const bindPW = "ASTER@admin";

async function authenticateLDAP(email: string, password: string) {
  const username = email.split('@')[0];
  const filter = `(|(mail=${email})(uid=${username}))`;
  
  const escapedFilter = filter.replace(/"/g, '\\"');
  const escapedBase = baseDN.replace(/"/g, '\\"');
  const escapedBindDN = bindDN.replace(/"/g, '\\"');
  const escapedBindPW = bindPW.replace(/"/g, '\\"');
  
  const searchCmd = `${dockerCmd} exec ldap-server ldapsearch -H ${ldapUrl} -D "${escapedBindDN}" -w "${escapedBindPW}" -b "${escapedBase}" "${escapedFilter}" dn givenName sn mail cn uid`;
  
  const output = execSync(searchCmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  
  const lines = output.split('\n');
  let dn = '';
  const attrs: Record<string, string> = {};
  
  for (const line of lines) {
    if (line.startsWith('dn:')) {
      dn = line.substring(4).trim();
    } else if (line.includes(':') && !line.startsWith('#')) {
      const colonIdx = line.indexOf(':');
      const key = line.substring(0, colonIdx).trim().toLowerCase();
      const val = line.substring(colonIdx + 1).trim();
      if (key && val && !val.startsWith('#')) {
        attrs[key] = val;
      }
    }
  }
  
  if (!dn) return null;
  
  const escapedUserDN = dn.replace(/"/g, '\\"');
  const escapedPW = password.replace(/"/g, '\\"');
  const authCmd = `${dockerCmd} exec ldap-server ldapsearch -H ${ldapUrl} -D "${escapedUserDN}" -w "${escapedPW}" -b "${escapedUserDN}" "(objectClass=*)" dn`;
  
  try {
    execSync(authCmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
  } catch {
    return null;
  }
  
  const userUID = attrs.uid;
  const memberDN = `uid=${userUID},ou=users,dc=aster,dc=cat`;
  const groupDN = "cn=gestors,ou=groups,dc=aster,dc=cat";
  
  const escapedMemberDN = memberDN.replace(/"/g, '\\"');
  const escapedGroupDN = groupDN.replace(/"/g, '\\"');
  
  const checkCmd = `${dockerCmd} exec ldap-server ldapsearch -H ${ldapUrl} -D "${escapedBindDN}" -w "${escapedBindPW}" -b "${escapedGroupDN}" "member=${escapedMemberDN}" dn`;
  
  let groupOutput;
  try {
    groupOutput = execSync(checkCmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
  } catch {
    return null;
  }
  
  if (groupOutput.includes('gestors')) {
    return {
      id: dn,
      name: attrs.givenName || attrs.cn || email,
      email: attrs.mail || email
    };
  }
  
  return null;
}

export async function POST(request: Request) {
  const authEnabled = process.env.ENABLE_AUTH !== 'false';
  
  if (!authEnabled) {
    return NextResponse.json({ error: 'Auth is disabled via ENABLE_AUTH=false' }, { status: 403 });
  }
  
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    const user = await authenticateLDAP(email, password);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const sessionToken = Buffer.from(JSON.stringify({
      ...user,
      exp: Date.now() + 24 * 60 * 60 * 1000
    })).toString('base64');
    
    const cookieStore = await cookies();
    cookieStore.set('session-token', sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      sessionToken: sessionToken
    });
    
  } catch (err: any) {
    console.error('[Simple Login] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}