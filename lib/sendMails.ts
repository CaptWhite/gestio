import { google } from 'googleapis';
import MarkdownIt from 'markdown-it';
import pool from '@/lib/db';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

interface CartaDB {
  header: string;
  body: string;
  footer: string;
  _to: string;
  _cc: string;
  _cco: string;
  subject: string;
}

interface TemplateVars {
  [key: string]: string | undefined;
  nom?: string;
  cognoms?: string;
  email?: string;
  dni?: string;
  adreca?: string;
  poblacio?: string;
  telefon_fix?: string;
  mobil?: string;
}

function replaceTemplateVars(text: string, vars: TemplateVars): string {
  return text.replace(/\{(\w+)\}/g, (match: string, varName: string) => {
    return vars[varName] !== undefined ? vars[varName]! : match;
  });
}

function buildHTML(vars: TemplateVars, carta: CartaDB): string {
  let mainProcessed = replaceTemplateVars(carta.body, vars);
  mainProcessed = mainProcessed.replace(/\\n|\n/g, '\n');
  const mainHTML = md.render(mainProcessed);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
</head>
<body>
${carta.header}
${mainHTML}
${carta.footer}
</body>
</html>`;
}

function buildText(vars: TemplateVars, carta: CartaDB): string {
  const mainProcessed = replaceTemplateVars(carta.body, vars);
  return mainProcessed
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*/g, '')
    .replace(/\n/g, '\n\n');
}

function encodeHeader(str: string): string {
  const encoded = Buffer.from(str, 'utf8');
  const base64 = encoded.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `=?UTF-8?B?${base64}?=`;
}

async function getCartaFromDB(title: string): Promise<CartaDB | null> {
  const [rows]: any = await pool.query(
    'SELECT header, body, footer, _to, _cc, _cco, subject FROM cartes WHERE title = ?',
    [title]
  );
  if (rows.length === 0) {
    return null;
  }
  return rows[0] as CartaDB;
}

async function sendMailGmail(config: { from: string; to: string; cc: string; bcc: string; subject: string; html: string }): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.OAUTH_CLIENTID,
    process.env.OAUTH_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.OAUTH_REF_TOKEN
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const toHeader = `To: ${config.to}`;
  const ccHeader = config.cc ? `Cc: ${config.cc}` : '';
  const bccHeader = config.bcc ? `Bcc: ${config.bcc}` : '';
  const subjectHeader = `Subject: ${encodeHeader(config.subject)}`;
  const fromHeader = `From: ${config.from}`;
  const contentTypeHeader = `Content-Type: text/html; charset="UTF-8"`;

  const headers = [fromHeader, toHeader, ccHeader, bccHeader, subjectHeader, contentTypeHeader]
    .filter(h => h.length > 0)
    .join('\r\n');

  const message = `${headers}\r\n\r\n${config.html}`;
  const encodedMessage = Buffer.from(message, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  });

  return res.data.id || '';
}

export async function sendMail(cartaTitle: string, memberData: TemplateVars): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const carta = await getCartaFromDB(cartaTitle);
    if (!carta) {
      return { success: false, error: `No es va trobar cap carta amb title='${cartaTitle}'` };
    }

    const config = {
      from: process.env.MAIL_USERNAME || '',
      to: replaceTemplateVars(carta._to, memberData),
      cc: replaceTemplateVars(carta._cc, memberData),
      bcc: replaceTemplateVars(carta._cco, memberData),
      subject: replaceTemplateVars(carta.subject, memberData),
      html: buildHTML(memberData, carta)
    };

    const messageId = await sendMailGmail(config);
    console.log(`[SendMail] Correu enviat: ${messageId} per carta title='${cartaTitle}'`);

    return { success: true, messageId };
  } catch (err: any) {
    console.error(`[SendMail] Error enviant correu:`, err);
    return { success: false, error: err.message || 'Error desconegut' };
  }
}