import { Argument, Command, Option } from "commander";
import { Config, updateConfigFile } from '../lib/config.js';
import { question, continueOrSkip } from "./prompt.js";
import chalk from "chalk";
import { exit } from "process";
import { initateAuth, listLabels } from "../lib/gmail.js";
import fs from 'fs';

export default function SetupCommand(program: Command) {
    const root = program.command('setup')
        .description('Configure the CLI.')
        .action(async () => {

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

            const displayGmail = chalk.blue("\n[Current Mailbox]: ", Config.currentMailbox ?? chalk.red('<NOT SET>'));
            const configureGmail = await continueOrSkip("Set up Gmail? " + displayGmail + " ", { default: Config.gmailToken ? 'n' : 'y' }).prompt();
            if (configureGmail) {

                // Give a list of options:
                 // - use provided creds
                 // - use own gmail creds (provide a link)
                // TODO: Do log in.
                // console.log("Coming soon...")

                // Ask for path to credentials.json. Load the file and add to Config
                const credentialsPath = await question("> Enter the path to your credentials.json: ").prompt();
                if (!fs.existsSync(credentialsPath)) {
                    console.log(chalk.red("The provided path does not exist. Please try again."));
                    exit(1);
                }
                
                const credentials = fs.readFileSync(credentialsPath, 'utf8');
                Config.googleCredentialsJSON = credentials;
                updateConfigFile(Config);
                console.log(chalk.green("Gmail credentials set up successfully."));

                const auth = await initateAuth();
                await listLabels(auth);
            }
        });

}


const formatSensitiveData = (data: string | undefined) => {
    if (!data) {
        return chalk.red('<NOT SET>');
    }
    // Show first 4 characters, then replace with ****
    return data.slice(0, 4) + '****';
}

