import chalk from "chalk";
import { Command } from "commander";
import fs from "fs";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import ora from "ora";
import readline from "readline";
import { createDraft, sendEmail } from "../lib/gmail.js";
import { initateAuth } from "../lib/google-auth.js";
import { requestLLM } from "../lib/openai.js";
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
      if (createAsGmailDrafts) {
        for (const email of emails) {
          await createDraft(
            auth,
            email.to,
            email.subject,
            await marked.parse(email.body)
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
            await marked.parse(email.body)
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
  const response = await draftEmail(templateContents, contactsContents, model, {
    limit,
  });

  const responseJSON = JSON.parse(response ?? "{}");
  return {
    emails: responseJSON.emails ?? [],
    warnings: responseJSON.warnings ?? [],
  };
};

const getFileContents = async (file: string) => {
  return fs.readFileSync(file, "utf8");
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

const draftEmail = async (
  template: string,
  contacts: string,
  model: string,
  options?: { limit?: number }
) => {
  const formatted = gptPrompt
    .replace(/!TEMPLATE!/g, template)
    .replace(/!CONTACTS!/g, contacts)
    .replace(/!LIMIT!/g, options?.limit?.toString() ?? "None");
  const messages = [
    {
      role: "system",
      content:
        "You are an intelligent email drafting tool for performing mail merges. You are given a list of contacts and an email template. You are asked to generate a list of emails.",
    },
    { role: "user", content: formatted },
  ];

  const response = await requestLLM(messages, { model });
  return response;
};

const gptPrompt = `
    You are an intelligent email drafting tool for performing mail merges. You are given a list of contacts and an email template. You are asked to generate a list of emails.

    The contacts list may include fields like name, email, phone, etc. 

    The email template may include placeholders for the contact's name, email, phone, etc. 
    Placeholders in the email template are indicated by {{ }} delimters.

    The email template may also include user-specified directives for the AI to follow.
    Directives are indicated by << >> delimters.

    NOTE: The mail template variables may not match the contact fields exactly and you may need to perform some data mapping. Additionally if there are gaps that cannot be filled
    by the contact data you may need to tweak the message to accommodate for missing data. You should also smooth out any discrepancies in grammar introduced by plugging the fields in.

    IMPORTANT: Unless explicitly given direction to do so or only for fixing grammar, DO NOT change the user's content or you will be penalized.

    Return your answer in the following JSON format (the body should be formatted as markdown regardless of the template).
    {
        "emails": [
            {
                "to": "email@example.com",
                "subject": "Hello, {{ contact.name }}",
                "body": "Hello, {{ contact.name }}. This is a test email."
            }
        ],
        "warnings": <Any warnings or errors to surface to user as a list>
    }


    # TEMPLATE
    !TEMPLATE!


    # CONTACTS
    !CONTACTS!

    # LIMIT
    !LIMIT!
`;

type Email = {
  to: string;
  subject: string;
  body: string;
};

const mockResponse = `{
    "emails": [
        {
            "to": "tim.ray@chemeketa.edu",
            "subject": "Inquiry Regarding Your Role at Chemeketa Community College",
            "body": "Hi Tim,\\n\\nI found your email from the Chemeketa Community College website and I thought it would be interesting to reach out to you regarding your role as Dean of Agriculture Science and Technology. I'm a startup founder looking to build software in higher ed and I was wondering if you'd be able to help me answer a few questions:\\n\\n- What are the biggest challenges you face in your current position?\\n- How is technology currently utilized in your department?\\n\\nWould you be able to jump on a call sometime next week?\\n\\nThanks,\\nCharles\\n[https://linkedin.com/in/charlesyu108](https://linkedin.com/in/charlesyu108)"
        },
        {
            "to": "schills@linnbenton.edu",
            "subject": "Inquiry Regarding Your Role at Linn-Benton Community College",
            "body": "Hi Steve,\\n\\nI found your email from the Linn-Benton Community College website and I thought it would be interesting to reach out to you regarding your role as Dean: Advanced Manufacturing & Transportation Technology. I'm a startup founder looking to build software in higher ed and I was wondering if you'd be able to help me answer a few questions:\\n\\n- What are the current goals for your department?\\n- What software solutions are currently in use and how effective are they?\\n\\nWould you be able to jump on a call sometime next week?\\n\\nThanks,\\nCharles\\n[https://linkedin.com/in/charlesyu108](https://linkedin.com/in/charlesyu108)"
        }
    ],
    "warnings": ["This is a mock response"]
}
`;

const getMockEmails = (): { emails: Email[]; warnings: string[] } => {
  const responseJSON = JSON.parse(mockResponse);
  return {
    emails: responseJSON.emails ?? [],
    warnings: responseJSON.warnings ?? [],
  };
};
