import chalk from "chalk";
import { Command } from "commander";

export default function ConfigureHelp(program: Command) {
    program.configureHelp({
        formatHelp: (cmd, helper) => {
            const termWidth = helper.padWidth(cmd, helper);
            const formatItem = (term: string, description: string) => {
                return `\t${chalk.blue(term.padEnd(termWidth))}\t${chalk.green(description)}`;
            };

            const helpTextParts : string[] = [];

            if (cmd.parent === null) {
                const titleText = `⚡ mailmerge-js`;
                const title = chalk.bold.magentaBright(`\n${titleText}\n`);
                helpTextParts.push(title);
            }

            const usage = helper.commandUsage(cmd);
            if (cmd.parent && usage) {
                helpTextParts.push(`${chalk.bold('Usage:')}\n  ${usage}\n`);
            }

            const description = helper.commandDescription(cmd);
            if (description) {
                helpTextParts.push(`${chalk.bold('Description:')}\n  ${description}\n`);
            }

            const commands = helper.visibleCommands(cmd);
            if (commands.length > 0) {
                helpTextParts.push(`${chalk.bold('Commands:')}\n` + commands.map(subCmd => {
                    return formatItem(subCmd.name(), subCmd.description());
                }).join('\n') + '\n');
            }


            const options = helper.visibleOptions(cmd);
            if (options.length > 0) {
                helpTextParts.push(`${chalk.bold('Options:')}\n` + options.map(option => {
                    return formatItem(helper.optionTerm(option), helper.optionDescription(option));
                }).join('\n') + '\n\n');
            }

            return helpTextParts.join('\n');
        }
    });
};

