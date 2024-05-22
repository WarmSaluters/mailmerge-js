import chalk from "chalk";
import { Command } from "commander";
import fs from "fs";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import ora from "ora";
import { continueOrSkip } from "./prompt.js";
import { EmailPreviewer } from "./preview.js";
import { mailMergeAIBulk } from "../lib/mail-merge.js";
import { getMockEmails } from "../lib/mocks.js";

export default function DraftCommand(program: Command) {
  //@ts-ignore
  marked.use(markedTerminal());

  program
    .command("draft")
    .description("Draft emails using AI.")
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

      console.log(chalk.yellow("Exiting... BUT HAVE NOT IMPLEMENTED SAVE YET"));
      return;
    });
}

const getEmailsFromLLM = async (template: any, options: any) => {
  const { model, contacts, limit } = options;

  const templateContents = await getFileContents(template);
  const contactsContents = await getFileContents(contacts);
  const response = await mailMergeAIBulk(templateContents, contactsContents, model, {
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
