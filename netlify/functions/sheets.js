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

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const sheets = await getSheets();
    const { action, ...params } = JSON.parse(event.body || '{}');

    switch (action) {
      case 'getTasks': {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A1:M`,
        });
        return { statusCode: 200, headers, body: JSON.stringify(res.data.values || []) };
      }

      case 'addTask': {
        const { row } = params;
        // Generate ID server-side from live sheet data to prevent duplicates across devices
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
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, id: nextId }) };
      }

      case 'updateCell': {
        const { range, value } = params;
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!${range}`,
          valueInputOption: 'RAW',
          requestBody: { values: [[value]] },
        });
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }

      case 'updateRow': {
        const { range, values } = params;
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!${range}`,
          valueInputOption: 'RAW',
          requestBody: { values: [values] },
        });
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
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
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }

      case 'getConfig': {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${CONFIG_SHEET}!A1:B100`,
        });
        return { statusCode: 200, headers, body: JSON.stringify(res.data.values || []) };
      }

      case 'updateConfig': {
        const { configData } = params;
        // Clear existing config and rewrite
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
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }

      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
    }
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
