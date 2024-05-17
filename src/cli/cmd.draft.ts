import { Command } from "commander";

export default function DraftCommand(program: Command) {
    program
        .command('draft')
        .description('Draft emails')
        .action(() => {
            console.log('Drafting emails...');
        });
}