const { google } = require('googleapis');

const SPREADSHEET_ID = '1wOo0wX5rNe2W29NGYe34Yckc9f4TFwfW3SZl30bJenI';
const SHEET_NAME = 'Sheet1';
const CONFIG_SHEET = 'Config';

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheets() {
  const auth = await getAuth();
  return google.sheets({ version: 'v4', auth });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sheets = await getSheets();
    const { action, ...params } = req.body || {};

    switch (action) {
      case 'getTasks': {
        const result = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A1:M`,
        });
        return res.status(200).json(result.data.values || []);
      }

      case 'addTask': {
        const { row } = params;
        const existing = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A2:A`,
        });
        const existingIds = (existing.data.values || []).map(r => parseInt(r[0]) || 0);
        const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
        row[0] = String(nextId);
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A:M`,
          valueInputOption: 'RAW',
          requestBody: { values: [row] },
        });
        return res.status(200).json({ success: true, id: nextId });
      }

      case 'updateCell': {
        const { range, value } = params;
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!${range}`,
          valueInputOption: 'RAW',
          requestBody: { values: [[value]] },
        });
        return res.status(200).json({ success: true });
      }

      case 'updateRow': {
        const { range, values } = params;
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!${range}`,
          valueInputOption: 'RAW',
          requestBody: { values: [values] },
        });
        return res.status(200).json({ success: true });
      }

      case 'deleteRow': {
        const { rowIndex } = params;
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: 0,
                  dimension: 'ROWS',
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
              },
            }],
          },
        });
        return res.status(200).json({ success: true });
      }

      case 'getConfig': {
        const result = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${CONFIG_SHEET}!A1:B100`,
        });
        return res.status(200).json(result.data.values || []);
      }

      case 'updateConfig': {
        const { configData } = params;
        await sheets.spreadsheets.values.clear({
          spreadsheetId: SPREADSHEET_ID,
          range: `${CONFIG_SHEET}!A1:B100`,
        });
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${CONFIG_SHEET}!A1:B${configData.length}`,
          valueInputOption: 'RAW',
          requestBody: { values: configData },
        });
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
