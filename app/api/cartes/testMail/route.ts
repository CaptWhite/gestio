import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { cookies } from 'next/headers';
import { sendMail } from '@/lib/sendMails';

async function checkSimpleSession(): Promise<boolean> {
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

export async function POST(request: Request) {
  const authEnabled = process.env.ENABLE_AUTH !== 'false';
  
  if (authEnabled) {
    const session = await getServerSession(authOptions);
    const hasSimpleSession = await checkSimpleSession();
    
    if (!session && !hasSimpleSession) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }
  
  try {
    const { cartaTitle, to, cc, cco, sexe } = await request.json();
    
    const memberData = {
      nom: 'Prova',
      cognoms: 'Test',
      email: to,
      dni: '00000000A',
      adreca: '',
      poblacio: '',
      telefon_fix: '',
      mobil: '',
      sexe: sexe || 'H',
    };
    
    const mailOverrides = {
      to,
      cc,
      cco,
    };
    
    const result = await sendMail(cartaTitle, memberData, mailOverrides);
    
    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      return NextResponse.json({ error: result.error || 'Error al enviar correu' }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Test Mail Error:", error);
    return NextResponse.json({ error: 'Error al enviar correu de prova' }, { status: 500 });
  }
}