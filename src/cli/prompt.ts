import * as readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import chalk from 'chalk';

export class InputPrompt {
    private callback: ((input: string) => any) | null = (input) => input;

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

export const continueOrSkip = (promptString: string, opts?: { default: 'y' | 'n' }) => {
    const _default = opts?.default ?? 'y';
    const suffix = _default === 'y' ? '[Y/n]' : '[y/N]';

    return new InputPrompt(chalk.bold(promptString) + suffix + " ")
    .onInput((input) => {

        let shouldContinue = _default === 'y' ? true : false;

        if (input.toLowerCase() === 'y') {
            shouldContinue = true
        }
        else if (input.toLowerCase() === 'n') {
            shouldContinue = false;
        }

        return shouldContinue;
    });
}
