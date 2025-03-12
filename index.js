const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and URL-encoded form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Google Sheets API setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1mla5YRqe6MOTxuv3MVSmE7rBks_CHUSGmxf7HGctiQI'; // Replace with your actual spreadsheet ID
const SHEET_NAME = 'Sheet1'; // Change if your sheet has a different name

// Load the service account credentials
const credentials = require('./credentials.json');
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  SCOPES
);
const sheets = google.sheets({ version: 'v4', auth });

// Endpoint to handle form submission
app.post('/submit', async (req, res) => {
  try {
    const { name, email, answer } = req.body;

    if (!name || !email || !answer) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Prepare the row data; adding a timestamp can be helpful
    const values = [[new Date().toISOString(), name, email, answer]];
    const resource = { values };

    // Append the data to the Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`,
      valueInputOption: 'RAW',
      resource: resource,
    });

    res.status(200).json({ message: 'Submission received and recorded.' });
  } catch (error) {
    console.error('Error writing to Google Sheet:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
