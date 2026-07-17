import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { cookies } from 'next/headers';

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

export async function GET(request: Request) {
  const authEnabled = process.env.ENABLE_AUTH !== 'false';
  
  if (authEnabled) {
    const session = await getServerSession(authOptions);
    const hasSimpleSession = await checkSimpleSession();
    
    if (!session && !hasSimpleSession) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }
  
  try {
    const [rows]: any = await pool.query('SELECT * FROM cartes ORDER BY id DESC');
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ 
      error: 'Error al conectar con la base de datos.',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authEnabled = process.env.ENABLE_AUTH !== 'false';
  
  if (authEnabled) {
    const session = await getServerSession(authOptions);
    const hasSimpleSession = await checkSimpleSession();
    
    if (!session && !hasSimpleSession) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }
  
  try {
    const body = await request.json();
    const { id, title, _to, _cc, _cco, subject, body: cartaBody, bodyFem } = body;

    await pool.query(
      `UPDATE cartes SET 
        title = ?, _to = ?, _cc = ?, _cco = ?, subject = ?, body = ?, bodyFem = ?
      WHERE id = ?`,
      [title, _to, _cc, _cco, subject, cartaBody, bodyFem || '', id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'Error al actualizar carta en la base de datos' }, { status: 500 });
  }
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
    const body = await request.json();
    const { title, _to, _cc, _cco, subject, body: cartaBody, bodyFem } = body;
    
    await pool.query(
      `INSERT INTO cartes (title, _to, _cc, _cco, subject, body, bodyFem) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, _to || '', _cc || '', _cco || '', subject, cartaBody || '', bodyFem || '']
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'Error al añadir carta a la base de datos' }, { status: 500 });
  }
}