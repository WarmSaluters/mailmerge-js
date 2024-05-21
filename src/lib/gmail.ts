import axios from "axios";
import { Auth, google } from "googleapis";
import open from "open";
import readline from "readline";
import Config, { updateConfigFile } from "./config.js";

// Replace with mailmerge-js hosted server
const SERVER_URL = "http://localhost:3000";

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

  // Set mailbox on Config
  const mailbox = await getCurrentMailbox(oAuth2Client);
  Config.currentMailbox = mailbox ?? undefined;
  updateConfigFile(Config);
  return oAuth2Client;
}

// Function to initiateAuth with user-provided credentials
async function initiateAuthWithUserCredentials() {
  try {
    const credentials = JSON.parse(Config.googleCredentialsJSON ?? "null");
    const { client_id, client_secret, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log("Opening browser for authentication...");
    await open(authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const code: string = await new Promise((resolve) => {
      rl.question(
        "Finish the prompts and copy and paste the final url here: ",
        (answer) => {
          rl.close();
          const code = answer.split("code=")[1];
          resolve(code);
        }
      );
    });
    const tokenResponse = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokenResponse.tokens);
    Config.gmailToken = JSON.stringify(tokenResponse.tokens);
    updateConfigFile(Config);
    console.log("Token stored:", tokenResponse.tokens);
  } catch (error) {
    console.error("Error during authentication with user credentials:", error);
  }
}

// Function to initiateAuth with mailmerge-js server
async function initiateAuthWithMailmergeServer() {
  try {
    const response = await axios.get(
      `${SERVER_URL}/auth?scopes=${SCOPES.join(",")}`
    );
    const authUrl = response.data.authUrl;
    console.log("Opening browser for authentication...");
    await open(authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const code = await new Promise((resolve) => {
      rl.question("Enter the code from the page here: ", (answer) => {
        rl.close();
        resolve(answer);
      });
    });
    const tokenResponse = await axios.get(
      `${SERVER_URL}/oauth2callback?code=${code}`
    );
    const token = tokenResponse.data;
    Config.gmailToken = JSON.stringify(token);
    updateConfigFile(Config);
    console.log("Token stored:", token);
  } catch (error) {
    console.error(
      "Error during authentication with mailmerge-js server:",
      error
    );
  }
}

// Functions
export async function getCurrentMailbox(auth: Auth.OAuth2Client) {
  const gmail = google.gmail({ version: "v1", auth: auth });
  const res = await gmail.users.getProfile({ userId: "me" });
  console.log(res.data.emailAddress);
  return res.data.emailAddress;
}

export async function listLabels(auth: Auth.OAuth2Client) {
  const gmail = google.gmail({ version: "v1", auth: auth });
  const res = await gmail.users.labels.list({ userId: "me" });
  const labels = res.data.labels;
  if (labels && labels.length) {
    console.log("Labels:");
    labels.forEach((label) => console.log(`- ${label.name}`));
  } else {
    console.log("No labels found.");
  }
}

export async function createDraft(
  auth: Auth.OAuth2Client,
  to: string,
  subject: string,
  body: string
) {
  const gmail = google.gmail({ version: "v1", auth: auth });
  const raw = makeBody(to, "me", subject, body);
  const draft = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        raw: raw,
      },
    },
  });
  console.log("Draft Id: ", draft.data.id);
  return draft.data.id;
}

export async function sendEmail(
  auth: Auth.OAuth2Client,
  to: string,
  subject: string,
  body: string
) {
  const gmail = google.gmail({ version: "v1", auth: auth });
  const draftId = await createDraft(auth, to, subject, body);
  console.log("Draft Id: ", draftId);

  const send = await gmail.users.drafts.send({
    userId: "me",
    requestBody: {
      id: draftId,
    },
  });
  console.log("Mail sent with Id: ", send.data.id);
  return send.data.id;
}

function makeBody(to: string, from: string, subject: string, message: string) {
  // Build the full email content with proper line endings
  const fullEmail = [
    'Content-Type: text/plain; charset="UTF-8"\r\n',
    "MIME-Version: 1.0\r\n",
    "Content-Transfer-Encoding: 7bit\r\n",
    "To: ",
    to,
    "\r\n",
    "From: ",
    from,
    "\r\n",
    "Subject: ",
    subject,
    "\r\n\r\n",
    message,
  ].join("");

  console.log(fullEmail);

  // Base64 encode the entire email content
  const encodedEmail = Buffer.from(fullEmail)
    .toString("base64")
    .replace(/\+/g, "-") // Replace + with - to make base64 URL-friendly
    .replace(/\//g, "_"); // Replace / with _ to make base64 URL-friendly

  return encodedEmail;
}
