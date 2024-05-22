import chalk from 'chalk';
import inquirer from 'inquirer';

export class InputPrompt {
    private callback: ((input: string) => any) | null = (input) => input;

    constructor(private readonly promptString: string) {
        this.promptString = promptString;
    }

    onInput(callback: (input: string) => any) {
        this.callback = callback;
        return this;
    }

    async prompt () {
        const result = await inquirer.prompt([{
            type: 'input',
            name: 'result',
            message: this.promptString,
        }]);

        if (this.callback) {
            return this.callback(result.result);
        }
        return result.result;
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
