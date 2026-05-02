import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [rows]: any = await pool.query('SELECT * FROM tasques WHERE id = ?', [params.id]);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    const task = rows[0];
    // Formatear la fecha
    if (task.date_create) {
      task.date = new Date(task.date_create).toISOString().split('T')[0];
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { title, priority, type, payload } = data;
    
    await pool.query(
      'UPDATE tasques SET title = ?, priority = ?, type = ?, payload = ? WHERE id = ?',
      [title, priority, type, payload, params.id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
