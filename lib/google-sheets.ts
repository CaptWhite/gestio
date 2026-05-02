import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// This function will be called on the server-side to get the auth client
async function getAuthClient() {
  const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  
  if (!jsonString) {
    throw new Error("La variable GOOGLE_SERVICE_ACCOUNT_JSON no está definida en .env.local");
  }

  try {
    const credentials = JSON.parse(jsonString);
    const email = credentials.client_email;
    
    return new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });
  } catch (e) {
    throw new Error("El contenido de GOOGLE_SERVICE_ACCOUNT_JSON no es un JSON válido o no contiene 'client_email'.");
  }
}

export async function getSheetData() {
  let auth;
  try {
    auth = await getAuthClient();
  } catch (e: any) {
    throw e;
  }

  const sheets = google.sheets({ version: 'v4', auth });
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'TOTS!A2:Z',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    return rows.map((row, index) => {
      return {
        rowIndex: index + 2, // 1-based index + header row
        id: row[0] || '', // Nº
        sexe: row[1] || '',
        cognoms: row[2] || '',
        nom: row[3] || '',
        dni: row[4] || '',
        data_neix: row[5] || '',
        adreça: row[6] || '',
        poblacio: row[7] || '',
        professio: row[8] || '',
        mobil: row[9] || '',
        tel_fix: row[10] || '',
        email: row[11] || '', // Correu_e 1
        email2: row[12] || '',
        observacions: row[13] || '',
        data_alta: row[14] || '',
        cobrament: row[15] || '',
        motiu_baixa: row[16] || '',
        notes_baixa: row[17] || '',
        maynom: row[18] || '',
        data_baixa: row[19] || '',
        compte: row[20] || '',
        motiu_baixa2: row[21] || '',
        quota: row[22] || '',
      };
    });
  } catch (error: any) {
    if (error.status === 403) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
      throw new Error(`Acceso denegado. Por favor, ve a tu Google Sheet, haz clic en 'Compartir' y añade este email como Editor: ${credentials.client_email}`);
    }
    throw error;
  }
}

export async function appendSheetRow(data: any[]) {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: 'TOTS!A2',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [data],
    },
  });
}

export async function updateSheetRow(rowIndex: number, data: any[]) {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: `TOTS!A${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [data],
    },
  });
}
