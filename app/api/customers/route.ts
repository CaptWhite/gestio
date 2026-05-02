import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');

  try {
    if (mode === 'stats') {
      // 1. Estadístiques de socis actius i sexe
      const [activeRows]: any = await pool.query(
        "SELECT sexe, COUNT(*) as count FROM socis WHERE data_baixa IS NULL OR data_baixa = '' OR data_baixa = '-' GROUP BY sexe"
      );

      let totalActive = 0;
      let homes = 0;
      let dones = 0;

      activeRows.forEach((row: any) => {
        const count = parseInt(row.count);
        totalActive += count;
        if (row.sexe === 'H') {
          homes += count;
        } else {
          dones += count;
        }
      });

      // 2. Altes per mes de l'any actual
      const currentYear = new Date().getFullYear();
      const [monthlyRows]: any = await pool.query(
        `SELECT MONTH(data_alta) as month, COUNT(*) as count 
         FROM socis 
         WHERE YEAR(data_alta) = ? AND data_alta IS NOT NULL
         GROUP BY MONTH(data_alta)`,
        [currentYear]
      );

      const monthlyData = Array(12).fill(0);
      monthlyRows.forEach((row: any) => {
        if (row.month >= 1 && row.month <= 12) {
          monthlyData[row.month - 1] = parseInt(row.count);
        }
      });

      // 3. Activitat recent (registre_log)
      let recentActivity = [];
      try {
        // Columna canviada manualment a 'descripcio' (sense accent)
        const [logRows]: any = await pool.query(
          "SELECT descripcio, date_update FROM registre_log ORDER BY date_update DESC LIMIT 5"
        );
        recentActivity = logRows.map((log: any) => ({
          descripcio: log.descripcio,
          date_update: log.date_update,
          time: log.date_update ? new Date(log.date_update).toLocaleString('ca-ES', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
          }) : '---'
        }));
      } catch (err) {
        console.error("Error al llegir registre_log:", err);
      }

      return NextResponse.json({
        totalActive,
        homes,
        dones,
        monthlyData,
        currentYear,
        recentActivity
      });
    }

    if (mode === 'nextId') {
      const [rows]: any = await pool.query('SELECT MAX(id_socis) as maxId FROM socis');
      const nextId = (rows[0]?.maxId || 0) + 1;
      return NextResponse.json({ nextId });
    }

    // Comportament normal: obtenir tots els socios
    const [rows]: any = await pool.query('SELECT * FROM socis ORDER BY cognoms, nom');
    
    const formattedRows = rows.map((row: any) => ({
      ...row,
      data_neix: row.data_neix ? new Date(row.data_neix).toISOString().split('T')[0] : null,
      data_alta: row.data_alta ? new Date(row.data_alta).toISOString().split('T')[0] : null,
      data_baixa: row.data_baixa ? new Date(row.data_baixa).toISOString().split('T')[0] : null,
    }));
    
    return NextResponse.json(formattedRows);
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ 
      error: 'Error al conectar con la base de datos.',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, id_socis, sexe, cognoms, nom, dni, data_neix, adreca, poblacio, 
      professio, mobil, telefon_fix, correu_e_1, correu_e2, observacions, 
      data_alta, cobrament_inicial, data_baixa, comptecorrent, motiu_baixa, quota 
    } = body;

    // Ara 'id' es la PK y 'id_socis' es el número de socio
    await pool.query(
      `UPDATE socis SET 
        id_socis = ?, sexe = ?, cognoms = ?, nom = ?, dni = ?, data_neix = ?, adreca = ?, 
        poblacio = ?, professio = ?, mobil = ?, telefon_fix = ?, correu_e_1 = ?, 
        correu_e2 = ?, observacions = ?, data_alta = ?, cobrament_inicial = ?, 
        data_baixa = ?, comptecorrent = ?, motiu_baixa = ?, quota = ?
      WHERE id = ?`,
      [
        id_socis, sexe, cognoms, nom, dni, data_neix || null, adreca, poblacio, 
        professio, mobil, telefon_fix, correu_e_1, correu_e2, observacions, 
        data_alta || null, cobrament_inicial, data_baixa || null, comptecorrent, 
        motiu_baixa, quota, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'Error al actualizar socio en la base de datos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      id_socis, sexe, cognoms, nom, dni, data_neix, adreca, poblacio, 
      professio, mobil, telefon_fix, correu_e_1, correu_e2, observacions, 
      data_alta, cobrament_inicial, data_baixa, comptecorrent, motiu_baixa, quota 
    } = body;
    
    // No insertamos 'id' porque es AUTO_INCREMENT
    await pool.query(
      `INSERT INTO socis (
        id_socis, sexe, cognoms, nom, dni, data_neix, adreca, poblacio, 
        professio, mobil, telefon_fix, correu_e_1, correu_e2, observacions, 
        data_alta, cobrament_inicial, data_baixa, comptecorrent, motiu_baixa, quota
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_socis, sexe, cognoms, nom, dni, data_neix || null, adreca, poblacio, 
        professio, mobil, telefon_fix, correu_e_1, correu_e2, observacions, 
        data_alta || new Date().toISOString().split('T')[0], 
        cobrament_inicial, data_baixa || null, comptecorrent, motiu_baixa, quota
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'Error al añadir socio a la base de datos' }, { status: 500 });
  }
}
