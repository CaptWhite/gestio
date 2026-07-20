import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isAuthorized } from '@/lib/apiAuth';

export async function GET() {
  const authorized = await isAuthorized();
  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const [rows]: any = await pool.query(
      "SELECT *, date_create as date FROM tasques WHERE title LIKE 'Alta automàtica Curs d\\'iniciació:%' ORDER BY date_create DESC"
    );

    const formattedRows = rows.map((row: any) => {
      let parsedPayload: Record<string, any> = {};
      try {
        parsedPayload = typeof row.payload === 'string' ? JSON.parse(row.payload) : (row.payload || {});
      } catch {
        parsedPayload = {};
      }

      return {
        ...row,
        date: row.date ? new Date(row.date).toISOString().split('T')[0] : null,
        payload: parsedPayload,
      };
    });

    return NextResponse.json(formattedRows);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Error carregant curs d\'iniciació', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authorized = await isAuthorized();
  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id, title, payload } = await request.json();

    await pool.query(
      'UPDATE tasques SET title = ?, payload = ? WHERE id = ?',
      [title, JSON.stringify(payload), id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Error actualitzant tasca', details: error.message }, { status: 500 });
  }
}
