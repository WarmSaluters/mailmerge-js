// NOTE: This is only required if you want to serve your own auth server. Not needed for personal cli use

const express = require('express');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

app.get('/auth', (req, res) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: req.query.scopes.split(','),
    });
    res.json({ authUrl });
});

app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        res.json(tokens);
    } catch (error) {
        res.status(500).send('Error during authentication');
    }
});

app.get('/refresh', async (req, res) => {
    const storedTokens = JSON.parse(req.query.token);
    oAuth2Client.setCredentials(storedTokens);
    oAuth2Client.forceRefreshOnFailure = true;
    await oAuth2Client.getAccessToken();
    const tokens = oAuth2Client.credentials;
    res.json({tokens});
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});