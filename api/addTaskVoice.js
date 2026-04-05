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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, token } = req.body || {};

    const expectedToken = process.env.VOICE_TOKEN;
    if (expectedToken && token !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Missing task text' });
    }

    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:A`,
    });
    const rows = result.data.values || [];
    const ids = rows.map(r => parseInt(r[0]) || 0);
    const nextId = String((ids.length > 0 ? Math.max(...ids) : 0) + 1);

    const today = todayStr();
    const row = [nextId, text.trim(), 'New', 'Medium', '', '', '', '', '', '', today, today, ''];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:L`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    return res.status(200).json({ success: true, id: nextId, title: text.trim() });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
