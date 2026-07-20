import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { addLDAPUserFromInscription, normalizeUID } from '@/lib/auth';
import { sendMail } from '@/lib/sendMails';
import { isAuthorized } from '@/lib/apiAuth';

export async function GET() {
  const authorized = await isAuthorized();
  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  try {
    const [rows]: any = await pool.query(
      "SELECT *, date_create as date FROM tasques WHERE title LIKE 'Inscripció de soci per web%' ORDER BY date_create DESC"
    );
    
    const formattedRows = rows.map((row: any) => {
      let parsedPayload = {};
      try {
        parsedPayload = typeof row.payload === 'string' ? JSON.parse(row.payload) : (row.payload || {});
      } catch {
        parsedPayload = {};
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
  const authorized = await isAuthorized();
  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  try {
    const { id, sexe } = await request.json();
    
    const [rows]: any = await pool.query('SELECT payload FROM tasques WHERE id = ?', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Inscription not found' }, { status: 404 });
    }
    
    let payload: Record<string, any> = {};
    try {
      payload = typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : (rows[0].payload || {});
    } catch {
      payload = {};
    }
    
    if (sexe) {
      payload.sexe = sexe;
    }

    const previousPagat = payload.pagat;
    const currentPagat = previousPagat === 'si' ? 'no' : 'si';
    payload.pagat = currentPagat;
    
    console.log(`[Inscripció] Alternant pagament per a tasca ID ${id}: ${previousPagat} -> ${currentPagat}`);
    
    await pool.query('UPDATE tasques SET payload = ? WHERE id = ?', [JSON.stringify(payload), id]);

    if (currentPagat === 'si') {
      console.log("[Inscripció] Procés d'inici per crear un nou soci...");
      try {
        const formatDate = (dateStr: string) => {
          if (!dateStr) return null;
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          return dateStr;
        };

        const nomObj = payload.nom;
        const adresaObj = payload.adresa || payload.adreca;
        
        const memberData: any = {
          id_socis: 0,
          nom: nomObj?.first_name || payload.nom || '',
          cognoms: nomObj?.last_name || payload.cognoms || '',
          dni: payload.dni || payload['dni-nif'] || '',
          email: payload.email || payload.correu_e_1 || '',
          adreca: adresaObj?.address_line_1 || payload.adreca || '',
          poblacio: adresaObj?.city || payload.poblacio || payload.localitat || '',
          telefon_fix: payload.telefon || payload.telefon_fix || '',
          mobil: payload.telefonmobil || payload.mobil || payload.telefon_mobil || '',
          data_neix: formatDate(payload.data_naixement || payload.datanaixement) || undefined,
          professio: payload.professio || '',
          quota: payload.quota || '',
          iban: payload.IBAN || payload.iban || '',
          observacions: payload.comentaris || '',
          sexe: payload.sexe || ''
        };

        console.log(`[Inscripció] Dades extretes per DNI: ${memberData.dni}`);

        if (memberData.dni) {
          const [existing]: any = await pool.query('SELECT id FROM socis WHERE dni = ?', [memberData.dni]);
          if (existing.length > 0) {
            console.log(`[Inscripció] Verificació de duplicat: El soci amb DNI ${memberData.dni} ja existeix. S'omet la inserció.`);
          } else {
            const [maxIdRow]: any = await pool.query('SELECT MAX(id_socis) as maxId FROM socis');
            const nextIdSocis = (maxIdRow[0]?.maxId || 0) + 1;
            memberData.id_socis = nextIdSocis;

            console.log(`[Inscripció] Inserció SQL iniciant-se amb el nou ID de soci: ${nextIdSocis}`);
            const [result]: any = await pool.query(
              `INSERT INTO socis (
                id_socis, sexe, nom, cognoms, dni, correu_e_1, adreca, poblacio, 
                telefon_fix, mobil, data_neix, professio, quota, 
                comptecorrent, observacions, data_alta
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                nextIdSocis,
                memberData.sexe,
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
            
            console.log(`[Inscripció] Èxit! Nou soci creat amb DB ID: ${result.insertId}`);
            
            await pool.query(
              "INSERT INTO registre_log (descripcio) VALUES (?)",
              [`Alta automàtica de soci des d'inscripció: ${memberData.nom} ${memberData.cognoms}`]
            );

            const uid = normalizeUID(memberData.nom, memberData.cognoms);
            const ldapSuccess = await addLDAPUserFromInscription(memberData, uid, nextIdSocis);
            if (!ldapSuccess) {
              console.warn(`[Inscripció] Alta LDAP no completada per ${memberData.nom} ${memberData.cognoms}. registre a la base de dades creat però usuari LDAP no creat.`);
            }

            const mailResult = await sendMail('Carta de presentacio', memberData);
            if (!mailResult.success) {
              console.warn(`[Inscripció] Error en enviar correu: ${mailResult.error}`);
            }

            const notificationMailResult = await sendMail('Notificació Alta de Soci ', memberData);
            if (!notificationMailResult.success) {
              console.warn(`[Inscripció] Error en enviar correu de notificació: ${notificationMailResult.error}`);
            }
          }
        } else {
          console.warn("[Inscripció] Avís crític: No s'ha trobat DNI al payload. Inserció avortada.");
        }
      } catch (err) {
        console.error("[Inscripció] ERROR en crear el soci:", err);
      }
    }
    
    return NextResponse.json({ success: true, pagat: currentPagat });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to toggle payment status' }, { status: 500 });
  }
}
