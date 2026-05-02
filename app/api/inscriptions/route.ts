import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      "SELECT *, date_create as date FROM tasques WHERE title LIKE 'Inscripció de soci per web%' ORDER BY date_create DESC"
    );
    
    const formattedRows = rows.map((row: any) => {
      let parsedPayload = {};
      try {
        parsedPayload = typeof row.payload === 'string' ? JSON.parse(row.payload) : (row.payload || {});
      } catch (e) {
        console.error("Error parsing payload for task", row.id);
      }
      
      return {
        ...row,
        date: row.date ? new Date(row.date).toISOString().split('T')[0] : null,
        payload: parsedPayload
      };
    });
    
    return NextResponse.json(formattedRows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to load inscriptions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    
    // Obtener la tarea actual
    const [rows]: any = await pool.query('SELECT payload FROM tasques WHERE id = ?', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Inscription not found' }, { status: 404 });
    }
    
    let payload = {};
    try {
      payload = typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : (rows[0].payload || {});
    } catch (e) {
      payload = {};
    }
    
    // Alternar campo 'pagat'
    // @ts-ignore
    const previousPagat = payload.pagat;
    const currentPagat = previousPagat === 'si' ? 'no' : 'si';
    // @ts-ignore
    payload.pagat = currentPagat;
    
    console.log(`[Inscription] Toggling payment for task ID ${id}: ${previousPagat} -> ${currentPagat}`);
    
    await pool.query('UPDATE tasques SET payload = ? WHERE id = ?', [JSON.stringify(payload), id]);

    // Si passa de 'no' a 'si', insertem a la taula de socis
    if (currentPagat === 'si') {
      console.log("[Inscription] Process starting to create new member...");
      try {
        // Formatejar data_naixement (de DD/MM/YYYY a YYYY-MM-DD)
        const formatDate = (dateStr: string) => {
          if (!dateStr) return null;
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          return dateStr;
        };

        // Extraure dades amb fallbacks per claus alternatives
        // @ts-ignore
        const nomObj = payload.nom;
        // @ts-ignore
        const adresaObj = payload.adresa || payload.adreca;
        
        // Mapeig flexible basat en els diferents formats possibles del payload
        const memberData = {
          // @ts-ignore
          nom: nomObj?.first_name || payload.nom || '',
          // @ts-ignore
          cognoms: nomObj?.last_name || payload.cognoms || '',
          // @ts-ignore
          dni: payload.dni || payload['dni-nif'] || '',
          // @ts-ignore
          email: payload.email || payload.correu_e_1 || '',
          // @ts-ignore
          adreca: adresaObj?.address_line_1 || payload.adreca || '',
          // @ts-ignore
          poblacio: adresaObj?.city || payload.poblacio || payload.localitat || '',
          // @ts-ignore
          telefon_fix: payload.telefon || payload.telefon || payload.telefon_fix || '',
          // @ts-ignore
          mobil: payload.telefonmobil || payload.mobil || payload.telefon_mobil || '',
          // @ts-ignore
          data_neix: formatDate(payload.data_naixement || payload.datanaixement),
          // @ts-ignore
          professio: payload.professio || payload.professio || '',
          // @ts-ignore
          quota: payload.quota || payload.quota || '',
          // @ts-ignore
          iban: payload.IBAN || payload.iban || '',
          // @ts-ignore
          observacions: payload.comentaris || ''
        };

        console.log(`[Inscription] Data extracted for DNI: ${memberData.dni}`);

        if (memberData.dni) {
          const [existing]: any = await pool.query('SELECT id FROM socis WHERE dni = ?', [memberData.dni]);
          if (existing.length > 0) {
            console.log(`[Inscription] Duplicate check: Member with DNI ${memberData.dni} already exists. Skipping insertion.`);
          } else {
            // Calcular el següent ID numèric de soci (id_socis) basat en el màxim existent
            const [maxIdRow]: any = await pool.query('SELECT MAX(id_socis) as maxId FROM socis');
            const nextIdSocis = (maxIdRow[0]?.maxId || 0) + 1;

            console.log(`[Inscription] SQL Insertion starting with new socio ID: ${nextIdSocis}`);
            const [result]: any = await pool.query(
              `INSERT INTO socis (
                id_socis, nom, cognoms, dni, correu_e_1, adreca, poblacio, 
                telefon_fix, mobil, data_neix, professio, quota, 
                comptecorrent, observacions, data_alta
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                nextIdSocis,
                memberData.nom,
                memberData.cognoms,
                memberData.dni,
                memberData.email,
                memberData.adreca,
                memberData.poblacio,
                memberData.telefon_fix,
                memberData.mobil,
                memberData.data_neix,
                memberData.professio,
                memberData.quota,
                memberData.iban,
                memberData.observacions,
                new Date().toISOString().split('T')[0]
              ]
            );
            
            console.log(`[Inscription] Success! New member created with DB ID: ${result.insertId}`);
            
            // Registrar l'activitat
            await pool.query(
              "INSERT INTO registre_log (descripcio) VALUES (?)",
              [`Alta automàtica de soci des d'inscripció: ${memberData.nom} ${memberData.cognoms}`]
            );
          }
        } else {
          console.warn("[Inscription] Critical warning: No DNI found in payload. Insertion aborted.");
        }
      } catch (err) {
        console.error("[Inscription] ERROR during member creation:", err);
      }
    }
    
    return NextResponse.json({ success: true, pagat: currentPagat });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to toggle payment status' }, { status: 500 });
  }
}
