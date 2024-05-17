import { Argument, Command, Option } from "commander";
import { Config, updateConfigFile } from '../lib/config';
import { question, continueOrSkip } from "./prompt";
import chalk from "chalk";
import { exit } from "process";
import { initateAuth, listLabels } from "../lib/gmail";

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

            const configureGmail = await continueOrSkip("Set up Gmail?").prompt();
            if (configureGmail) {
                // TODO: Do log in.
                console.log("Coming soon...")
                await listLabels();
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

