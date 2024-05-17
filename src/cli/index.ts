#!/usr/bin/env ts-node
import { Command } from 'commander';
import ConfigureHelp from './help';
import SendCommand from './cmd.send';
import DraftCommand from './cmd.draft';

const program = new Command();

program
    .name('mailmerge')
    .version('1.0.0')
    .description('A simple CLI for mail merge.')
    .action(() => {
        program.help();
    });

// ------------- Add things that mutate the program ----------
ConfigureHelp(program);
SendCommand(program);
DraftCommand(program);

// ------------- Execute the program ----------
program.parse(process.argv);
