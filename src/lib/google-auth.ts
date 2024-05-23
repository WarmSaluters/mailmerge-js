import axios from "axios";
import express from "express";
import { Auth, google } from "googleapis";
import http from "http";
import open from "open";
import Config, { updateConfigFile } from "./config.js";

const MAILMERGE_AUTH_SERVER_URL =
  process.env.AUTH_SERVER_URL ?? "https://auth.mailmerge-js.dev";

// Callback expected at: http://localhost:7278/oauth2callback, used to receive the auth code from Google
const LOCAL_REDIRECT_PORT = 7278;
const LOCAL_REDIRECT_URL =
  "http://localhost:" + LOCAL_REDIRECT_PORT + "/oauth2callback";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
];

// Return an authorized client, initiating consent if needed
export async function authorize(
  strategy?: "local" | "server"
): Promise<Auth.OAuth2Client> {
  let authorizer: Authorizer;
  if (strategy === "server") {
    authorizer = MailmergeServerAuthorizer;
  } else if (strategy === "local") {
    authorizer = LocalAuthorizer;
  } else {
    // If no explicit strategy is provided, assume existence of local credentials means use local server
    authorizer = Config.googleCredentialsJSON
      ? LocalAuthorizer
      : MailmergeServerAuthorizer;
  }

  if (!Config.gmailToken) {
    await authorizer.promptConsent();
  }
  return authorizer.getAuthorizedClient();
}

export interface Authorizer {
  promptConsent: () => Promise<void>;
  getAuthorizedClient: () => Promise<Auth.OAuth2Client>;
}

export const LocalAuthorizer: Authorizer = {
  promptConsent: async () => {
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
        res.send(
          "mailmerge-js authentication successful! You may now close this tab."
        );
        next();
      });

      console.log("Opening browser for authentication...");
      await open(authUrl);
      await callbackServer;
    } catch (error) {
      console.error(
        "Error during authentication with user credentials:",
        error
      );
    }
  },
  getAuthorizedClient: async () => {
    const credentials = JSON.parse(Config.googleCredentialsJSON ?? "null");
    const { client_id, client_secret } = credentials.installed;

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      LOCAL_REDIRECT_URL
    );
    oAuth2Client.setCredentials(JSON.parse(Config.gmailToken!));
    oAuth2Client.forceRefreshOnFailure = true;
    oAuth2Client.getAccessToken();
    return oAuth2Client;
  },
};

export const MailmergeServerAuthorizer: Authorizer = {
  promptConsent: async () => {
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
        res.send(
          "mailmerge-js authentication successful! You may now close this tab."
        );
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
  },
  getAuthorizedClient: async () => {
    const oAuth2Client = new google.auth.OAuth2();

    const token = JSON.parse(Config.gmailToken!);

    if (isTokenExpired(token)) {
      // Fire refresh token request to server
      const tokenResponse = await axios.get(
        `${MAILMERGE_AUTH_SERVER_URL}/refresh?token=${Config.gmailToken}`
      );
      const tokens = tokenResponse.data?.tokens;
      // Write back to config and save
      Config.gmailToken = JSON.stringify(tokens);
      updateConfigFile(Config);
    }

    oAuth2Client.setCredentials(JSON.parse(Config.gmailToken!));
    return oAuth2Client;
  },
};

async function openListeningCallback(
  callbackHandler: express.Handler,
  listeningPort: number = LOCAL_REDIRECT_PORT
) {
  const app = express();
  let server: http.Server | null = null;
  let backupTimeout: NodeJS.Timeout | null = null;

  try {
    app.get("/oauth2callback", (req, res, next) => {
      callbackHandler(req, res, () => {
        // Close server after handling callback
        server?.close();
        backupTimeout = setTimeout(() => {
          server?.close();
        }, 3000);
        next();
      });
    });

    server = app.listen(listeningPort, () => {
      console.log(
        `Listening for OAuth callback on http://localhost:${listeningPort}/oauth2callback`
      );
    });

    // Wait for the server to close (i.e., after receiving the callback)
    await new Promise((resolve) => {
      server?.on("close", resolve);
    });
  } catch (error) {
    console.error("Error during authentication:", error);
    server?.close();
  }
}

const isTokenExpired = (
  token: { expiry_date: number },
  toleranceMS: number = 10000
) => {
  return token.expiry_date < new Date().getTime() - toleranceMS;
};
