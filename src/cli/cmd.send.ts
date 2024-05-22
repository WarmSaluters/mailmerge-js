import { Command } from "commander";
import { sendEmail } from "../lib/gmail.js";
import { authorize } from "../lib/google-auth.js";
import chalk from "chalk";
import { EmailSerializer } from "./serializer.js";
import { Email } from "../lib/types.js";
import { continueOrSkip } from "./prompt.js";

export default function SendCommand(program: Command) {
  program
    .command("send")
    .description("Send email drafts.")
    .argument("<draft-path>", "path to the draft file or directory to send.")
    .option("--confirm", "sends without prompting for confirmation")
    .action(async (draftPath, options) => {
      const emails = await new EmailSerializer(draftPath).deserialize();

      if (options.confirm) {
        await sendEmails(emails);
      }
      const shouldSend = await continueOrSkip(`Send ${emails.length} emails?`).prompt();
      if (shouldSend) {
        await sendEmails(emails);
      }
    })
    .addHelpText('after', `

    ${chalk.bold("Drafts must be JSON files with the following format:")}
    ${chalk.cyan(`
      {
        "to": "<email>",
        "subject": "<subject>",
        "message": "<message-formatted-in-html>"
      }
    `)}
    `)
}


const sendEmails = async (emails: Email[]) => {
  const auth = await authorize();
  for (const email of emails) {
    await sendEmail(auth, email.to, email.subject, email.body);
  }
}



