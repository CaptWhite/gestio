import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  try {
    const [rows] = await pool.query('SELECT nom, correu FROM config LIMIT 1');
    const config = (rows as any[])[0];

    if (!config) {
      return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Error al obtener la configuración' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  try {
    const { nom, correu } = await request.json();

    await pool.query(
      'UPDATE config SET nom = ?, correu = ? WHERE id = (SELECT id FROM (SELECT id FROM config LIMIT 1) as t)',
      [nom, correu]
    );

    return NextResponse.json({ message: 'Configuración actualizada correctamente' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Error al actualizar la configuración' }, { status: 500 });
  }
}
