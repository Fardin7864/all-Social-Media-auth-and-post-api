require('dotenv').config();
const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/youtube.upload'
];

function getAuthUrl() {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });
  return url;
}

function getOAuthClient() {
  return oauth2Client;
}

module.exports = {
  getAuthUrl,
  getOAuthClient
};
