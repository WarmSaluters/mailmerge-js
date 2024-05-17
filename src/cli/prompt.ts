import * as readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import chalk from 'chalk';

export class InputPrompt {
    private callback: ((input: string) => any) | null = null;

    constructor(private readonly promptString: string) {
        this.promptString = promptString;
    }

    onInput(callback: (input: string) => any) {
        this.callback = callback;
        return this;
    }

    prompt() {
        console.log();
        const rl = readline.createInterface({ input: stdin, output: stdout });
        return new Promise<string>((resolve, reject) => {
            rl.question(this.promptString, (answer) => {
                rl.close();
                if (this.callback) {
                    resolve(this.callback(answer));
                }
            });
        });
    }
}

export const question = (promptString: string) => {
    return new InputPrompt(chalk.bold(promptString));
}

export const continueOrSkip = (promptString: string, defaultYes: boolean = true) => {
    const suffix = defaultYes ? '[Y/n]' : '[y/N]';
    const continuingAnswerLowercase = defaultYes ? 'y' : 'n';

    return new InputPrompt(chalk.bold(promptString) + suffix + " ")
    .onInput((input) => {
        let shouldContinue = false;

        if (input.toLowerCase() === continuingAnswerLowercase) {
            shouldContinue = true;
        }
        else if (input.toLowerCase() === '') {
            shouldContinue = true;
        }

        return shouldContinue;
    });
}
