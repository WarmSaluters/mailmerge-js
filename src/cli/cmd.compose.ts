import chalk from "chalk";
import { Command } from "commander";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import ora from "ora";
import showdown from "showdown";
import { createDraft, sendEmail } from "../lib/gmail.js";
import { authorize } from "../lib/google-auth.js";
import { getFileContents } from "../lib/utils.js";
import { continueOrSkip } from "./prompt.js";
import { EmailPreviewer } from "./preview.js";
import inquirer from "inquirer";
import { EmailSerializer } from "./serializer.js";
import Config from "../lib/config.js";
import { Renderer, getRenderer } from "../lib/renderers/index.js";
import { exit } from "process";
import { OllamaMissingModelError, OllamaNotFoundError } from "../lib/ollama.js";
import fs from "node:fs";

export default function DraftAndSendCommand(program: Command) {
  //@ts-expect-error not typed correctly
  marked.use(markedTerminal());

  program
    .command("compose")
    .description(`Compose mail using AI and save to drafts or send via Gmail.`)
    .argument("template", "email template to use")
    .requiredOption(
      "-c, --contacts <contacts>",
      "contacts file to use for mail merge" + chalk.cyan.bold(" (required)")
    )
    .option(
      "-r, --renderer <renderer>",
      "renderer to use for drafting " +
        chalk.yellow.bold("(see 'mailmerge renderers list' for options)"),
      "gpt-4o"
    )
    .option("-l, --limit <limit>", "number of emails to draft")
    .option("--outDir <outDir>", "If provided, save drafts to this directory.")
    .option("--no-preview", "Don't show a preview of the emails.")
    .action(async (template, options) => {
      // Drafting mail
      const spinner = ora("⚡ Composing emails...").start();
      const renderer = await getRenderer(options.renderer);
      const templateContents = await getFileContents(template);
      const contactsContents = await getFileContents(options.contacts);
      const { emails, warnings } = await tryRenderEmails(
        renderer,
        templateContents,
        contactsContents,
        options
      );
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
        console.log("=> Skipping previews...");
      }

      if (options.outDir) {
        const spinner = ora(
          `⚡ Saving drafts to ${chalk.cyan(options.outDir)}...`
        ).start();
        const serializer = new EmailSerializer(options.outDir);
        await serializer.serialize(emails);
        spinner.stop();
        console.log(
          chalk.green(
            `✅ Saved ${emails.length} drafts to ${chalk.cyan(options.outDir)}`
          )
        );
        return;
      }

      console.log(chalk.cyan(` [Current Mailbox]: ${Config.currentMailbox}`));

      // Specify how to save
      const { nextOption } = await inquirer.prompt([
        {
          type: "list",
          name: "nextOption",
          message: "What would you like to do with your drafts?\n",
          choices: [
            "Save to Gmail Drafts",
            "Save to Local Directory",
            "Send via Gmail",
            "Exit",
          ],
        },
      ]);

      if (nextOption === "Exit") {
        console.log("Exiting...");
        return;
      }

      if (nextOption === "Save to Local Directory") {
        const { outDir } = await inquirer.prompt([
          {
            type: "input",
            name: "outDir",
            message: "Enter the directory to save the drafts to:",
          },
        ]);
        if (!fs.existsSync(outDir)) {
          console.error(
            chalk.red(
              `❌ Error saving drafts to ${chalk.cyan(
                outDir
              )}: path does not exist`
            )
          );
          process.exit(1);
        }
        const spinner = ora(
          `⚡ Saving drafts to ${chalk.cyan(outDir)}...`
        ).start();
        const serializer = new EmailSerializer(outDir);
        await serializer.serialize(emails);
        spinner.stop();
        console.log(
          chalk.green(
            `✅ Saved ${emails.length} drafts to ${chalk.cyan(outDir)}`
          )
        );
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
          chalk.green(
            `✅ Created ${emails.length} drafts for all emails.\n You will need to go into Gmail to send them.`
          )
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
    .addHelpText(
      "after",
      `
${chalk.reset.bold("Addendum:")}
    ${chalk.cyan.bold(
      "NOTE: By default, this command only drafts emails. It will NOT send unless prompted.\n"
    )}
    ${chalk.yellowBright.bold("~~~ ABOUT TEMPLATES ~~~")}

    ${"Templates can be expressed in any markup language you like."}
    ${"As a best practice, you should clearly indicate the subject and body of the email."}
    ${`Use the delimiters ${chalk.bold.cyan(
      "{{ }}"
    )} to indicate variables or directives you want the AI to take.`}
    
    ${chalk.yellowBright.bold("~~~ ABOUT CONTACTS ~~~")}

    ${`Contacts can be provided in any format but must have at least an "email" field.`}
    `
    );
}

const tryRenderEmails = async (
  renderer: Renderer,
  templateContents: string,
  contactsContents: string,
  options: any
) => {
  try {
    const { emails, warnings } = await renderer.render(
      templateContents,
      contactsContents,
      options
    );
    return { emails, warnings };
  } catch (error) {
    console.log();

    if (error instanceof OllamaNotFoundError) {
      console.error(
        chalk.bold.red(
          "\n[!] Error: Ollama is not running or not installed! You need this to run local models."
        )
      );
      console.log(
        chalk.reset(
          "To install Ollama, download it from https://ollama.com/downloads\n"
        )
      );
      exit(1);
    }

    if (error instanceof OllamaMissingModelError) {
      console.error(chalk.bold.red("\n[!] Error: " + error.message));
      const missingModel = error.message.split("'", 3)[1];
      console.log(
        chalk.reset(
          `\nTo proceed, you can pull the model by running: \n\n\t${chalk.yellow(
            "ollama pull " + missingModel
          )}\n`
        )
      );
      exit(1);
    }

    console.error(chalk.bold.red("\n[!] Error: " + error));
    exit(1);
  }
};
