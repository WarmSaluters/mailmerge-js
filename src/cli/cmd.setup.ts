import { Argument, Command, Option } from "commander";
import { Config, deleteConfigFile, updateConfigFile } from '../lib/config.js';
import { question, continueOrSkip } from "./prompt.js";
import chalk from "chalk";
import { exit } from "process";
import { getCurrentMailbox, listLabels } from "../lib/gmail.js";
import { LocalAuthorizer, MailmergeServerAuthorizer, authorize } from "../lib/google-auth.js";
import fs from 'fs';

export default function SetupCommand(program: Command) {
    const root = program.command('setup')
        .description('Configure the CLI.')
        .action(async () => {
            await setupOpenAI();
            await setupGmail();
        });
    root.command('openai').description('Set up OpenAI API key.').action(setupOpenAI);
    root.command('gmail').description('Set up Gmail.').action(setupGmail);
    root.command('reset').description('Reset the setup.').action(resetSetup)
}

const setupGmail = async () => {

    const configureGmail = await continueOrSkip(
        "Set up Gmail?\n"+ 
        " You will need to create a google app if you have not done so already. \n" +
        chalk.green(" Instructions: https://github.com/WarmSaluters/mailmerge-js/blob/main/README.md#setting-up-google-app-credentials \n") +
        chalk.cyan("\n [Current Mailbox]: ", Config.currentMailbox ?? chalk.red('<NOT SET>')) + " ", 
        { default: Config.currentMailbox ? 'n' : 'y' }
    ).prompt();

    if (configureGmail) {
        // Ask for path to credentials.json. Load the file and add to Config
        const credentialsPath = await question("> Enter the path to your credentials.json: ").prompt();
        if (!fs.existsSync(credentialsPath)) {
            console.log(chalk.red("The provided path does not exist. Please try again."));
            exit(1);
        }
        const credentials = fs.readFileSync(credentialsPath, 'utf8');
        Config.googleCredentialsJSON = credentials;
        updateConfigFile(Config);
        await LocalAuthorizer.promptConsent();

        console.log(chalk.green("Gmail credentials set up successfully."));
        const auth = await authorize();
        const mailbox = await getCurrentMailbox(auth);
        Config.currentMailbox = mailbox ?? undefined;
        updateConfigFile(Config);
        console.log(chalk.green("Set mailbox to: ", Config.currentMailbox));
    }
}

const setupOpenAI = async () => {
    const displayKey = chalk.blue("\n[Current API Key]: ", formatSensitiveData(Config.openaiAPIKey));
    const configureOpenAI = await continueOrSkip("Set up OpenAI API key? " + displayKey + " ", { default: Config.openaiAPIKey ? 'n' : 'y' }).prompt();

    if (configureOpenAI) {
        await question("> Enter your OpenAI API key: ")
        .onInput(async (input) => {
            if (input.trim() === '') {
                console.log(chalk.red("No API key provided. Please try again."));
                exit(1);
            }
            Config.openaiAPIKey = input;
            updateConfigFile(Config);
            console.log(chalk.green("OpenAI API key set up successfully."));
        })
        .prompt();
    }
}

const resetSetup = async () => {
    const reset = await continueOrSkip("Are you sure you want to reset the setup?" + chalk.bold.red("\nTHIS ACTION CANNOT BE UNDONE"), { default: 'n' }).prompt();
    if (reset) {
        deleteConfigFile();
        console.log(chalk.green("Setup reset successfully."));
    }
}

const formatSensitiveData = (data: string | undefined) => {
    if (!data) {
        return chalk.red('<NOT SET>');
    }
    // Show first 4 characters, then replace with ****
    return data.slice(0, 4) + '****';
}

