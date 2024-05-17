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

            const usage = helper.commandUsage(cmd);
            if (usage) {
                helpTextParts.push(`${chalk.bold('Usage:')}\n\n  ${usage}\n\n`);
            }

            const description = helper.commandDescription(cmd);
            if (description) {
                helpTextParts.push(`${chalk.bold('Description:')}\n\n  ${description}\n\n`);
            }

            const commands = helper.visibleCommands(cmd);
            if (commands.length > 0) {
                helpTextParts.push(`${chalk.bold('Commands:')}\n\n` + commands.map(subCmd => {
                    return formatItem(subCmd.name(), subCmd.description());
                }).join('\n') + '\n\n');
            }


            const options = helper.visibleOptions(cmd);
            if (options.length > 0) {
                helpTextParts.push(`${chalk.bold('Options:')}\n\n` + options.map(option => {
                    return formatItem(helper.optionTerm(option), helper.optionDescription(option));
                }).join('\n') + '\n\n');
            }

            return chalk.black(helpTextParts.join('\n'));
        }
    });
};

