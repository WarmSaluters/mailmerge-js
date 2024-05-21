import chalk from "chalk";
import { Command } from "commander";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import ora from "ora";
import readline from "readline";
import showdown from "showdown";
import { createDraft, sendEmail } from "../lib/gmail.js";
import { initateAuth } from "../lib/google-auth.js";
import { mailMergeAIBulk } from "../lib/mail-merge.js";
import { getMockEmails } from "../lib/mocks.js";
import { Email } from "../lib/types.js";
import { getFileContents } from "../lib/utils.js";
import { continueOrSkip } from "./prompt.js";

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

      const auth = await initateAuth();
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

class EmailPreviewer {
  private index: number;
  private linesWritten: number = 0;

  constructor(private emails: Email[]) {
    this.emails = emails;
    this.index = 0;
  }

  get current() {
    return this.emails[this.index];
  }

  show() {
    return new Promise<void>((resolve, reject) => {
      this.render();

      // Create readline interface
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // Function to handle key press
      // @ts-ignore
      rl.input.on("keypress", (str: string, key: any) => {
        // You can add your logic here to handle the key press

        if (key.sequence === "\u0003") {
          // Ctrl+C to exit
          rl.close();
          resolve();
        }

        if (key.name === "q") {
          rl.close();
          resolve();
        }

        if (key.name === "left") {
          this.index--;
          if (this.index < 0) {
            this.index = 0;
          }
          this.render();
        }

        if (key.name === "right") {
          this.index++;
          if (this.index >= this.emails.length) {
            this.index = this.emails.length - 1;
          }
          this.render();
        }
      });

      // Set the stdin to raw mode to detect key press immediately
      process.stdin.setRawMode(true);
      process.stdin.resume();
    });
  }

  render = () => {
    this.clearLines(this.linesWritten);
    const { content, lines } = this.renderEmailPreviewContent(
      this.current,
      this.index,
      this.emails.length
    );
    console.log(content);
    console.log(
      chalk.bold('Use "<-" to go back, "->" to go forward, "q" to exit.')
    );
    this.linesWritten = lines + 4;
  };

  renderEmailPreviewContent = (email: Email, index: number, total: number) => {
    const content =
      "\n" +
      `${chalk.bold(`-`.repeat(process.stdout.columns))}` +
      "\n" +
      chalk.bold(`Displaying email ${index + 1} of ${total}`) +
      "\n" +
      `${chalk.bold(`-`.repeat(process.stdout.columns))}` +
      "\n" +
      `${chalk.bold.cyan(`Subject: ${chalk.yellowBright(email.subject)}`)}\n` +
      `${chalk.bold.cyan(`To: ${chalk.yellowBright(email.to)}`)}\n\n` +
      marked.parse(email.body);

    const lines = content.split("\n").length;
    return { content, lines };
  };

  clearLines = (n: number) => {
    for (let i = 0; i < n; i++) {
      //first clear the current line, then clear the previous line
      const y = i === 0 ? null : -1;
      process.stdout.moveCursor(0, y as number);
      process.stdout.clearLine(1);
    }
    process.stdout.cursorTo(0);
  };
}
