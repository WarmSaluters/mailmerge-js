import axios from "axios";
import { Auth, google } from "googleapis";
import open from "open";
import Config, { updateConfigFile } from "./config.js";
import express from "express";
import http from "http";

const MAILMERGE_AUTH_SERVER_URL = "https://auth.mailmerge-js.dev";

// Callback expected at: http://localhost:7278/oauth2callback, used to receive the auth code from Google
const LOCAL_REDIRECT_PORT = 7278
const LOCAL_REDIRECT_URL = "http://localhost:" + LOCAL_REDIRECT_PORT + "/oauth2callback";

const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
];

// Return an authorized client
export async function initateAuth(): Promise<Auth.OAuth2Client> {
    if (!Config.gmailToken) {
        console.log("No token found, initiating authentication...");
        if (Config.googleCredentialsJSON) {
            await initiateAuthWithUserCredentials();
        } else {
            await initiateAuthWithMailmergeServer();
        }
    }

    const token = JSON.parse(Config.gmailToken!);
    const oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials(token);
    // Get or refresh token
    oAuth2Client.forceRefreshOnFailure = true;
    oAuth2Client.getAccessToken();

    return oAuth2Client;
}

// Function to initiateAuth with user-provided credentials
export async function initiateAuthWithUserCredentials() {
    try {
        const credentials = JSON.parse(Config.googleCredentialsJSON ?? "null");
        const { client_id, client_secret } = credentials.installed;

        const oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            LOCAL_REDIRECT_URL
        );
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: SCOPES,
        });

        const callbackServer = openListeningCallback(async (req, res, next) => {
            const code = req.query.code as string;
            const tokenResponse = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokenResponse.tokens);
            Config.gmailToken = JSON.stringify(tokenResponse.tokens);
            updateConfigFile(Config);
            res.send("mailmerge-js authentication successful! You may now close this tab.");
            next();
        });

        console.log("Opening browser for authentication...");
        await open(authUrl);
        await callbackServer;
    } catch (error) {
        console.error("Error during authentication with user credentials:", error);
    }
}

// Function to initiateAuth with mailmerge-js server
export async function initiateAuthWithMailmergeServer() {
    try {
        const response = await axios.get(
            `${MAILMERGE_AUTH_SERVER_URL}/auth?scopes=${SCOPES.join(",")}`
        );
        const authUrl = response.data.authUrl;

        const callbackServer = openListeningCallback(async (req, res, next) => {
            const code = req.query.code as string;
            const tokenResponse = await axios.get(
                `${MAILMERGE_AUTH_SERVER_URL}/oauth2callback?code=${code}`
            );
            const token = tokenResponse.data;
            Config.gmailToken = JSON.stringify(token);
            updateConfigFile(Config);
            res.send("mailmerge-js authentication successful! You may now close this tab.");
            next();
        });

        console.log("Opening browser for authentication...");
        await open(authUrl);
        await callbackServer;
    } catch (error) {
        console.error(
            "Error during authentication with mailmerge-js server:",
            error
        );
    }
}

async function openListeningCallback(callbackHandler: express.Handler, listeningPort: number = LOCAL_REDIRECT_PORT) {
    const app = express();
    let server: http.Server | null = null;

    try {
        app.get('/oauth2callback', callbackHandler);
        
        // Close server after handling callback
        app.use((req, res, next) => {
            server?.close();
            next();
        })

        server = app.listen(listeningPort, () => {
            console.log(`Listening for OAuth callback on http://localhost:${listeningPort}/oauth2callback`);
        });

        // Wait for the server to close (i.e., after receiving the callback)
        await new Promise((resolve) => server?.on('close', resolve));

    } catch (error) {
        if (server) {
            server.close();
        }
    }
}