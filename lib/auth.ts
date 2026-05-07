import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { execSync } from "child_process"

const isWindows = process.platform === "win32"
const dockerCmd = isWindows ? "docker.exe" : "docker"

interface LDAPUser {
  dn: string
  attrs: Record<string, string>
}

export const authOptions = {
  secret: process.env.AUTH_SECRET as string,
  useSecureCookies: false,
  sessionStrategy: "jwt" as const,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials: any) {
        console.log("[Authorize] email:", credentials?.email)
        const email = credentials?.email || credentials?.username
        const password = credentials?.password
        if (!email || !password) return null

        try {
          const user = await authenticateWithLDAP(email, password)
          if (user && user.dn) {
            return {
              id: user.dn,
              name: user.attrs.givenName || user.attrs.cn || email,
              email: user.attrs.mail || email
            }
          }
        } catch (err) {
          console.log("Auth error:", err)
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) { token.id = user.id; token.name = user.name; token.email = user.email }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    }
  }
}

function dockerExecLDAPSearch(email: string, password: string): Promise<LDAPUser | null> {
  return new Promise((resolve) => {
    const { execSync } = require('child_process')
    const ldapUrl = process.env.LDAP_URL || "ldap://localhost:389"
    const baseDN = process.env.LDAP_BASE_DN || "dc=aster,dc=cat"
    const bindDN = process.env.LDAP_BIND_DN || "cn=admin,dc=aster,dc=cat"
    const bindPW = process.env.LDAP_BIND_PW || ""

    console.log("=== LDAP ===")
    console.log("URL:", ldapUrl)
    console.log("BASE:", baseDN)

    const username = email.split('@')[0]
    const filter = `(|(mail=${email})(uid=${username}))`
    console.log("Filter:", filter)

    const escapedFilter = filter.replace(/"/g, '\\"')
    const escapedBase = baseDN.replace(/"/g, '\\"')
    const escapedBindDN = bindDN.replace(/"/g, '\\"')
    const escapedBindPW = bindPW.replace(/"/g, '\\"')

    const searchCmd = `${dockerCmd} exec ldap-server ldapsearch -H ${ldapUrl} -D "${escapedBindDN}" -w "${escapedBindPW}" -b "${escapedBase}" "${escapedFilter}" dn givenName sn mail cn`

    try {
      const output = execSync(searchCmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })

      const lines = output.split('\n')
      let dn = ''
      const attrs: Record<string, string> = {}

      for (const line of lines) {
        if (line.startsWith('dn:')) {
          dn = line.substring(4).trim()
        } else if (line.includes(':') && !line.startsWith('#')) {
          const colonIdx = line.indexOf(':')
          const key = line.substring(0, colonIdx).trim().toLowerCase()
          const val = line.substring(colonIdx + 1).trim()
          if (key && val && !val.startsWith('#')) {
            attrs[key] = val
          }
        }
      }

      if (!dn) {
        console.log("User not found")
        return resolve(null)
      }

      console.log("Found DN:", dn)

      const escapedUserDN = dn.replace(/"/g, '\\"')
      const escapedPW = password.replace(/"/g, '\\"')
      const authCmd = `${dockerCmd} exec ldap-server ldapsearch -H ${ldapUrl} -D "${escapedUserDN}" -w "${escapedPW}" -b "${escapedUserDN}" "(objectClass=*)" dn`

      try {
        const authOutput = execSync(authCmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 })

        if (authOutput.includes('dn:') || authOutput.includes('result: 0')) {
          console.log("AUTH OK!")
          resolve({ dn, attrs })
        } else {
          console.log("AUTH FAILED")
          resolve(null)
        }
      } catch (authErr: any) {
        console.log("AUTH FAILED:", authErr.message)
        resolve(null)
      }
    } catch (err: any) {
      console.log("Search error:", err.message)
      resolve(null)
    }
  })
}

async function authenticateWithLDAP(email: string, password: string): Promise<LDAPUser | null> {
  return dockerExecLDAPSearch(email, password)
}