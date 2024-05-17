import axios from 'axios';
import open from 'open';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const SERVER_URL = 'http://localhost:0'; // Replace with your server URL
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

// Return an authorized client
export async function initateAuth() {
    if (!fs.existsSync(TOKEN_PATH)) {
        console.log('No token found, initiating authentication...');
        if (fs.existsSync(CREDENTIALS_PATH)) {
            await initiateAuthWithUserCredentials();
        } else {
            await initiateAuthWithMailmergeServer();
        }
    }

    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    const oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials(token);

    return oAuth2Client;
}


// Function to initiateAuth with user-provided credentials
async function initiateAuthWithUserCredentials() {
    try {
        const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
        const { client_id, client_secret, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/gmail.readonly'],
        });
        console.log('Opening browser for authentication...');
        await open(authUrl);
        await open(authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const code : string= await new Promise((resolve) => {
            rl.question('Enter the code from the page here: ', (answer) => {
                rl.close();
                resolve(answer);
            });
        });
        const tokenResponse = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokenResponse.tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenResponse.tokens));
        console.log('Token stored:', tokenResponse.tokens);
    } catch (error) {
        console.error('Error during authentication with user credentials:', error);
    }
}

// Function to initiateAuth with mailmerge-js server
async function initiateAuthWithMailmergeServer() {
    try {
        const response = await axios.get(`${SERVER_URL}/auth`);
        const authUrl = response.data.authUrl;
        console.log('Opening browser for authentication...');
        await open(authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const code = await new Promise((resolve) => {
            rl.question('Enter the code from the page here: ', (answer) => {
                rl.close();
                resolve(answer);
            });
        });
        const tokenResponse = await axios.get(`${SERVER_URL}/oauth2callback?code=${code}`);
        const token = tokenResponse.data;
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        console.log('Token stored:', token);
    } catch (error) {
        console.error('Error during authentication with mailmerge-js server:', error);
    }
}

export async function listLabels() {
    const oAuth2Client = await initateAuth();
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const res = await gmail.users.labels.list({ userId: 'me' });
    const labels = res.data.labels;
    if (labels && labels.length) {
        console.log('Labels:');
        labels.forEach((label) => console.log(`- ${label.name}`));
    } else {
        console.log('No labels found.');
    }
}

