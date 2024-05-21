import { Auth, google } from "googleapis";

// Functions
export async function getCurrentMailbox(auth: Auth.OAuth2Client) {
  const gmail = google.gmail({ version: "v1", auth: auth });
  const res = await gmail.users.getProfile({ userId: "me" });
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
  return send.data.id;
}

function makeBody(to: string, from: string, subject: string, message: string) {
  // Build the full email content with proper line endings
  const fullEmail = [
    'Content-Type: text/html; charset="UTF-8"\r\n',
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

  // Base64 encode the entire email content
  const encodedEmail = Buffer.from(fullEmail)
    .toString("base64")
    .replace(/\+/g, "-") // Replace + with - to make base64 URL-friendly
    .replace(/\//g, "_"); // Replace / with _ to make base64 URL-friendly

  return encodedEmail;
}
