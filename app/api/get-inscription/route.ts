import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isAuthorized } from '@/lib/apiAuth';
import mysql from 'mysql2/promise';

const remoteConfig = {
  host: process.env.REMOTE_DB_HOST,
  user: process.env.REMOTE_DB_USER,
  password: process.env.REMOTE_DB_PASSWORD,
  port: parseInt(process.env.REMOTE_DB_PORT || '3306'),
  database: process.env.REMOTE_DB_DATABASE,
};

interface FormConfig {
  form_id: number;
  name: string;
  last: number;
  text: string;
}

function transformInscription(response: string) {
  const data = JSON.parse(response);

  const memberObj = {
    nom: data.nom?.first_name || '',
    cognoms: data.nom?.last_name || '',
    "dni-nif": data.dni || '',
    adreca: data.adresa?.address_line_1 || '',
    codipostal: data.adresa?.zip || '',
    localitat: data.adresa?.city || '',
    provincia: data.adresa?.state || '',
//    pais: data.adresa?.country || '',
    email: data.email || data.repetir || '',
    telefon: data.telefon || '',
//    telefonmobil: data.mobil || '',
    datanaixement: data.datetime || '',
    professio: data.professio || '',
    estudis: data.estudis || '',
    quota: data.inscripcio || '',

    instruments: data.teniu || '',
    models: data.models || '',
    motiu: data.motiu || '',
    com_coneixer_aster: data.com_coneixer_aster || '',
    com_coneixer_curs: data.com_coneixer_curs || '',
//    iban: data.IBAN || '',
//    comentaris: data.comentaris || '',
//    nousoci: data.rao || '',
//    onconegut: data.conegut_per || '',
//    coneixements: data.nivell_coneixements || '',
//    instrumentobservacio: data.te_instrument || '',
//    descripcio: data.el_pot_descriure || '',
//    espera: data.que_espera_trobar_a_aster || '',
//    aporta: data.que_aporta || data.aportar || '',
    pagat: 'no',
  };

  return {
    memberObj,
    jsonString: JSON.stringify(memberObj).replace(/\r?\n|\r/g, ' '),
  };
}

async function processForm(
  remoteConn: mysql.Connection,
  form: FormConfig
): Promise<{ form: string; form_id: number; processed: number; first: any; last: any; ult_inscripcio: number }> {
  const processed: any[] = [];
  let currentId = form.last;

  while (true) {
    const [rows]: any = await remoteConn.execute(
      'SELECT response FROM wpas_fluentform_submissions WHERE form_id = ? AND serial_number = ?',
      [form.form_id, currentId]
    );

    if (rows.length === 0) break;

    const result = transformInscription(rows[0].response);
    const { memberObj, jsonString } = result;

    const title = `${form.text}: ${memberObj.cognoms}, ${memberObj.nom}`;
    await pool.query(
      'INSERT INTO tasques (title, type, status, priority, payload) VALUES (?, ?, ?, ?, ?)',
      [title, 'Inscripcio', 'pending', 'high', jsonString]
    );

    const logDesc = `${form.text}: ${memberObj.cognoms}, ${memberObj.nom}`;
    await pool.query('INSERT INTO registre_log (descripcio) VALUES (?)', [logDesc]);

    processed.push({
      serial: currentId,
      title,
      member: { nom: memberObj.nom, cognoms: memberObj.cognoms, email: memberObj.email },
    });

    currentId++;
  }

  form.last = currentId;

  return {
    form: form.name,
    form_id: form.form_id,
    processed: processed.length,
    first: processed[0] || null,
    last: processed[processed.length - 1] || null,
    ult_inscripcio: currentId,
  };
}

export async function POST() {
  const authorized = await isAuthorized();
  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let remoteConn;
  try {
    const [configRows]: any = await pool.query('SELECT ult_inscripcio FROM config LIMIT 1');
    if (configRows.length === 0) {
      return NextResponse.json({ error: 'Config no trobada' }, { status: 500 });
    }

    const raw = configRows[0].ult_inscripcio;
    if (!raw && raw !== 0) {
      return NextResponse.json({ error: 'ult_inscripcio buit a config' }, { status: 500 });
    }

    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    remoteConn = await mysql.createConnection(remoteConfig);

    const results: any[] = [];

    if (typeof parsed === 'object' && parsed.forms) {
      for (const form of parsed.forms) {
        const result = await processForm(remoteConn, form);
        results.push(result);
      }
      await pool.query(
        'UPDATE config SET ult_inscripcio = ? WHERE id = (SELECT id FROM (SELECT id FROM config LIMIT 1) as t)',
        [JSON.stringify(parsed)]
      );
    } else {
      const form: FormConfig = {
        form_id: 4,
        name: 'Fes-te Soci',
        last: typeof parsed === 'number' ? parsed : parseInt(parsed),
        text: 'Inscripció de soci per web',
      };
      const result = await processForm(remoteConn, form);
      results.push(result);
      await pool.query(
        'UPDATE config SET ult_inscripcio = ? WHERE id = (SELECT id FROM (SELECT id FROM config LIMIT 1) as t)',
        [form.last]
      );
    }

    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);

    return NextResponse.json({
      status: 'success',
      total_processed: totalProcessed,
      forms: results,
    });
  } catch (error: any) {
    console.error('[get-inscription] Error:', error);
    return NextResponse.json({ error: error.message || 'Error processant inscripció' }, { status: 500 });
  } finally {
    if (remoteConn) await remoteConn.end();
  }
}
