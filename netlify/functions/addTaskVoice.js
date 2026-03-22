const { google } = require('googleapis');

const SPREADSHEET_ID = '1wOo0wX5rNe2W29NGYe34Yckc9f4TFwfW3SZl30bJenI';
const SHEET_NAME = 'Sheet1';

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { text, token } = JSON.parse(event.body || '{}');

    // Simple token auth — set VOICE_TOKEN in Netlify env vars
    const expectedToken = process.env.VOICE_TOKEN;
    if (expectedToken && token !== expectedToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (!text || !text.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing task text' }) };
    }

    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Read existing IDs to find the next one
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:A`,
    });
    const rows = res.data.values || [];
    const ids = rows.map(r => parseInt(r[0]) || 0);
    const nextId = String((ids.length > 0 ? Math.max(...ids) : 0) + 1);

    const today = todayStr();
    // 12 columns: ID, Title, Status, Priority, Domain, Subdomain, Due, WaitingOn, Notes, Subtasks, Created, Updated
    const row = [nextId, text.trim(), 'New', 'Medium', '', '', '', '', '', '', today, today, ''];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:L`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, id: nextId, title: text.trim() }),
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
