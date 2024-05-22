import chalk from "chalk";
import { Command } from "commander";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import ora from "ora";
import showdown from "showdown";
import { createDraft, sendEmail } from "../lib/gmail.js";
import { authorize } from "../lib/google-auth.js";
import { mailMergeAIBulk } from "../lib/mail-merge.js";
import { getMockEmails } from "../lib/mocks.js";
import { Email } from "../lib/types.js";
import { getFileContents } from "../lib/utils.js";
import { continueOrSkip } from "./prompt.js";
import { EmailPreviewer } from "./preview.js";

export default function DraftAndSendCommand(program: Command) {
  //@ts-ignore
  marked.use(markedTerminal());

  program
    .command("draft-and-send")
    .description("Draft emails using AI and send them to Gmail.")
    .argument("template", "email template to use for mail merge")
    .requiredOption(
      "-c, --contacts <contacts>",
      "contacts to use for mail merge"
    )
    .option("-m, --model <model>", "ai model to use for drafting", "gpt-4o")
    .option("-l, --limit <limit>", "number of emails to draft")
    .option("--mock", "mock drafting")
    .action(async (template, options) => {
      const spinner = ora("⚡ Drafting emails...").start();

      const { emails, warnings } = options.mock
        ? getMockEmails()
        : await getEmailsFromLLM(template, options);

      spinner.stop();

      if (warnings.length > 0) {
        console.log(chalk.yellow("[!] Completed with warnings:"));
        for (const warning of warnings) {
          console.log(chalk.magenta(`[!] ${warning}`));
        }
      }
      console.log(chalk.green(`✅ Drafted ${emails.length} emails.`));

      const showPreviews = await continueOrSkip("Show previews?").prompt();
      if (showPreviews) {
        const previewer = new EmailPreviewer(emails);
        await previewer.show();
      }

      const sendToGmail = await continueOrSkip(
        "Send mail with Gmail?"
      ).prompt();
      if (!sendToGmail) {
        console.log("Exiting without sending...");
        return;
      }

      const auth = await authorize();
      const createAsGmailDrafts = await continueOrSkip(
        "Create as drafts only? You will need to go into Gmail and send them."
      ).prompt();
      const converter = new showdown.Converter({ simpleLineBreaks: true });

      if (createAsGmailDrafts) {
        for (const email of emails) {
          await createDraft(
            auth,
            email.to,
            email.subject,
            converter.makeHtml(email.body)
          );
        }
        console.log(
          chalk.green(`✅ Created ${emails.length} drafts for all emails.`)
        );
      } else {
        for (const email of emails) {
          await sendEmail(
            auth,
            email.to,
            email.subject,
            converter.makeHtml(email.body)
          );
        }
        console.log(chalk.green(`✅ Sent ${emails.length} emails.`));
      }
      return;
    });
}

const getEmailsFromLLM = async (
  template: any,
  options: any
): Promise<{ emails: Email[]; warnings: string[] }> => {
  const { model, contacts, limit } = options;

  const templateContents = await getFileContents(template);
  const contactsContents = await getFileContents(contacts);
  const response = await mailMergeAIBulk(
    templateContents,
    contactsContents,
    model,
    {
      limit,
    }
  );

  const responseJSON = JSON.parse(response ?? "{}");
  return {
    emails: responseJSON.emails ?? [],
    warnings: responseJSON.warnings ?? [],
  };
};