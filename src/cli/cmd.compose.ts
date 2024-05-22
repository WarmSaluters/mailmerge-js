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
import inquirer from "inquirer";
import { EmailSerializer } from "./serializer.js";

export default function DraftAndSendCommand(program: Command) {
  //@ts-ignore
  marked.use(markedTerminal());

  program
    .command("compose")
    .description(`Compose mail using AI and save to drafts or send via Gmail.\n  ${chalk.cyan.bold("NOTE: By default, this command only drafts emails. It will NOT send unless prompted.")}`)
    .argument("template", "email template to use")
    .requiredOption(
      "-c, --contacts <contacts>",
      "contacts file to use for mail merge" + chalk.cyan.bold(" (required)")
    )
    .option("-m, --model <model>", "ai model to use for drafting", "gpt-4o")
    .option("-l, --limit <limit>", "number of emails to draft")
    .option("--outDir <outDir>", "If provided, save drafts to this directory.")
    .option("--no-preview", "Don't show a preview of the emails.")
    .option("--mock", "(developer) mock a response from the LLM")
    .action(async (template, options) => {
      // Drafting mail
      const spinner = ora("⚡ Composing emails...").start();
      const emailFetcher = options.mock ? getMockEmails : getEmailsFromLLM;
      const { emails, warnings } = await emailFetcher(template, options);
      spinner.stop();

      if (warnings.length > 0) {
        console.log(chalk.yellow("[!] Completed with warnings:"));
        for (const warning of warnings) {
          console.log(chalk.magenta(`[!] ${warning}`));
        }
      }
      console.log(chalk.green(`✅ Drafted ${emails.length} emails.`));

      if (options.noPreview === undefined || options.noPreview === false) {
        const showPreviews = await continueOrSkip("Show previews?").prompt();
        if (showPreviews) {
          const previewer = new EmailPreviewer(emails);
          await previewer.show();
        }
      } else {
        console.log("=> Skipping previews...")
      }

      if (options.outDir) {
        const spinner = ora(`⚡ Saving drafts to ${chalk.cyan(options.outDir)}...`).start();
        const serializer = new EmailSerializer(options.outDir);
        await serializer.serialize(emails);
        spinner.stop();
        console.log(chalk.green(`✅ Saved ${emails.length} drafts to ${chalk.cyan(options.outDir)}`))
        return;
      }

      // Specify how to save
      const { nextOption } = await inquirer.prompt([{
        type: "list",
        name: "nextOption",
        message: "What would you like to do with your drafts?\n",
        choices: ["Save to Gmail Drafts", "Save to Local Directory", "Send via Gmail", "Exit"]
      }]);

      if (nextOption === "Exit") {
        console.log("Exiting...");
        return;
      }

      if (nextOption === "Save to Local Directory") {
        const { outDir } = await inquirer.prompt([{
          type: "input",
          name: "outDir",
          message: "Enter the directory to save the drafts to:",
        }]);
        const spinner = ora(`⚡ Saving drafts to ${chalk.cyan(outDir)}...`).start();
        const serializer = new EmailSerializer(outDir);
        await serializer.serialize(emails);
        spinner.stop();
        console.log(chalk.green(`✅ Saved ${emails.length} drafts to ${chalk.cyan(outDir)}`))
        return;
      }

      const converter = new showdown.Converter({ simpleLineBreaks: true });
      const auth = await authorize();

      if (nextOption === "Save to Gmail Drafts") {
        for (const email of emails) {
          await createDraft(
            auth,
            email.to,
            email.subject,
            converter.makeHtml(email.body)
          );
        }
        console.log(
          chalk.green(`✅ Created ${emails.length} drafts for all emails.\n You will need to go into Gmail to send them.`)
        );
      }

      if (nextOption === "Send via Gmail") {
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
    })
    .addHelpText('after', `
    ${chalk.yellowBright.bold("~~~ ABOUT TEMPLATES ~~~")}

    ${"Templates can be expressed in any markup language you like."}
    ${"As a best practice, you should clearly indicate the subject and body of the email."}
    ${`Use the delimiters ${chalk.bold.cyan("{{ }}")} to indicate variables or directives you want the AI to take.`}
    
    ${chalk.yellowBright.bold("~~~ ABOUT CONTACTS ~~~")}

    ${`Contacts can be provided in any format but must have at least an "email" field.`}
    `)
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