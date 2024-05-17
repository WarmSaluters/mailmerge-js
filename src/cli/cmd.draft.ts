import { Command } from "commander";
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import { requestLLM } from "../lib/openai";
import ora from 'ora';
import chalk from "chalk";
import fs from 'fs';


export default function DraftCommand(program: Command) {
    //@ts-ignore
    marked.use(markedTerminal());

    program
        .command('draft')
        .description('Draft emails')
        .option('--model <model>', 'ai model to use for drafting', 'gpt-4o')
        .option('--limit <limit>', 'number of emails to draft')
        .requiredOption("--contacts <contacts>", 'contacts to use for mail merge')
        .argument('template', 'email template to use for mail merge')
        .action(async (template, options) => {
            const spinner = ora('Drafting emails...').start();
            const { model, contacts, limit } = options;
            const templateContents = await getFileContents(template);
            const contactsContents = await getFileContents(contacts);
            const response = await draftEmail(templateContents, contactsContents, model, {limit});
            spinner.stop();
            const responseJSON = JSON.parse(response ?? '{}');
            const emails : Email[] = responseJSON.emails ?? [];
            const warnings = responseJSON.warnings ?? [];

            if (warnings.length > 0) {
                console.log(chalk.yellow('[!] Completed with warnings:'));
                for (const warning of warnings) {
                    console.log(chalk.magenta(`[!] ${warning}`));
                }
            }

            // Here would be nice to do an interactive walkthru of the emails

            for (let i = 0; i < emails.length; i++) {
                const { to, subject, body } = emails[i];

                console.log()
                console.log(`-`.repeat(process.stdout.columns));
                console.log(`Displaying email ${i + 1} of ${emails.length}`);
                console.log(`-`.repeat(process.stdout.columns));

                console.log(chalk.bold(chalk.cyan(`Subject: ${chalk.yellowBright(subject)}`)));
                console.log(chalk.bold(chalk.cyan(`To: <${chalk.yellowBright(to)}>`)));
                console.log(marked.parse(body));
            }

            console.log(`Drafted ${emails.length} emails.`);
        });
}

const getFileContents = async (file: string) => {
    return fs.readFileSync(file, 'utf8');
}


const draftEmail = async (template: string, contacts: string, model: string, options?: any) => {

    const formatted = gptPrompt.replace(/!TEMPLATE!/g, template).replace(/!CONTACTS!/g, contacts).replace(/!OPTIONS!/g, JSON.stringify(options));
    const messages = [
        { role: "system", content: "You are an intelligent email drafting tool for performing mail merges. You are given a list of contacts and an email template. You are asked to generate a list of emails." },
        { role: "user", content: formatted },
    ];

    const response = await requestLLM(messages, { model });
    return response;
}


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
        "warnings": <Any warnings or errors to surface to user>
    }


    # TEMPLATE
    !TEMPLATE!


    # CONTACTS
    !CONTACTS!

    # OTHER OPTIONS
    !OPTIONS!
`

type Email = {
    to: string;
    subject: string;
    body: string;
}
