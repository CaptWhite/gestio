import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { cookies, headers } from 'next/headers';

export async function checkInternalToken(): Promise<boolean> {
  const headerStore = await headers();
  const internalSecret = headerStore.get('x-internal-secret') || '';
  return !!internalSecret && internalSecret === process.env.INTERNAL_API_SECRET;
}

export async function checkSimpleSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session-token');
  
  if (!sessionCookie) return false;
  
  try {
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf8'));
    if (sessionData.exp && sessionData.exp > Date.now()) {
      return true;
    }
  } catch {
    return false;
  }
  
  return false;
}

export async function isAuthorized(): Promise<boolean> {
  const authEnabled = process.env.ENABLE_AUTH !== 'false';
  
  if (!authEnabled) return true;
  
  const internalToken = await checkInternalToken();
  if (internalToken) return true;
  
  const session = await getServerSession(authOptions);
  const hasSimpleSession = await checkSimpleSession();
  
  return !!(session || hasSimpleSession);
}
