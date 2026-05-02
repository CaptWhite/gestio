import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');

  try {
    if (mode === 'stats') {
      const [rows]: any = await pool.query(
        "SELECT status, COUNT(*) as count FROM tasques GROUP BY status"
      );

      let total = 0;
      let pending = 0;
      let completed = 0;

      rows.forEach((row: any) => {
        const count = parseInt(row.count);
        total += count;
        if (row.status === 'completed') {
          completed += count;
        } else {
          pending += count;
        }
      });

      // Obtenir les 4 tasques més recents (per data d'actualització)
      const [recentTasks]: any = await pool.query(
        "SELECT id, title, date_update FROM tasques ORDER BY date_update DESC LIMIT 4"
      );

      const formattedRecentTasks = recentTasks.map((t: any) => {
        if (!t.date_update) return { ...t, time: '---' };
        const d = new Date(t.date_update);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return {
          ...t,
          time: `${day}/${month}/${year} ${hours}:${minutes}`
        };
      });

      return NextResponse.json({ total, pending, completed, recentTasks: formattedRecentTasks });
    }

    const [rows]: any = await pool.query('SELECT *, date_create as date FROM tasques ORDER BY date_create DESC');
    
    // Formatear la fecha para que el frontend la entienda (YYYY-MM-DD)
    const formattedRows = rows.map((row: any) => ({
      ...row,
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : null
    }));
    
    return NextResponse.json(formattedRows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (data.action === 'toggle') {
      // Obtener el estado actual para alternarlo
      const [tasks]: any = await pool.query('SELECT status FROM tasques WHERE id = ?', [data.id]);
      if (tasks.length === 0) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      
      const newStatus = tasks[0].status === 'completed' ? 'pending' : 'completed';
      await pool.query('UPDATE tasques SET status = ? WHERE id = ?', [newStatus, data.id]);
      return NextResponse.json({ success: true, status: newStatus });
    }

    // Creación de una nueva tarea
    const { title, type, priority, status = 'pending' } = data;
    const [result]: any = await pool.query(
      'INSERT INTO tasques (title, type, status, priority) VALUES (?, ?, ?, ?)',
      [title, type || null, status, priority || 'medium']
    );
    
    const newTask = {
      id: result.insertId,
      title,
      type,
      status,
      priority,
      date: new Date().toISOString().split('T')[0]
    };
    
    return NextResponse.json(newTask);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to process task' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await pool.query('DELETE FROM tasques WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
