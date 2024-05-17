import { Command } from "commander";

export default function SendCommand(program: Command) {
    program
        .command('send')
        .description('Send a message to a list of recipients')
        .action(() => {
            console.log('Send a message to a list of recipients');
        });
}

