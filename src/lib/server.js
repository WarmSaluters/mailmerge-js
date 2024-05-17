// NOTE: This is only required if you want to serve your own auth server. Not needed for personal cli use

const express = require('express');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 0;
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

app.get('/auth', (req, res) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    res.json({ authUrl });
});

app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        res.json(tokens);
    } catch (error) {
        res.status(500).send('Error during authentication');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});