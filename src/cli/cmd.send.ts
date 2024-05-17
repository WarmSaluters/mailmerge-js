import { Command } from "commander";

export default function SendCommand(program: Command) {
    program
        .command('send')
        .description('Send a message to a list of recipients')
        .action(() => {
            console.log('Todo: Send a message to a list of recipients');
        });
}

