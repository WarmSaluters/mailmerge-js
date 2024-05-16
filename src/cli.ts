#!/usr/bin/env ts-node

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .version('1.0.0')
  .description('A simple CLI for mail merge')
  .option('-n, --name <type>', 'Specify name')
  .action((options) => {
    console.log(chalk.green(`Hello, ${options.name}!`));
  });

program.parse(process.argv);