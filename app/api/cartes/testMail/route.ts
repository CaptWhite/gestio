import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isAuthorized } from '@/lib/apiAuth';
import { sendMail } from '@/lib/sendMails';

export async function POST(request: Request) {
  const authorized = await isAuthorized();
  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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