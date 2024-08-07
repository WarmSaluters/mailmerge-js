#!/usr/bin/env node --no-warnings
import { Command } from "commander";
import ComposeCommand from "./cmd.compose.js";
import SendCommand from "./cmd.send.js";
import SetupCommand from "./cmd.setup.js";
import ConfigureHelp from "./help.js";
import _DevCommand from "./cmd.dev.js";
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJSON = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));

import RenderersCommand from "./cmd.renderers.js";

const program = new Command();
program
  .name(packageJSON.name)
  .version(packageJSON.version)
  .description(packageJSON.description)
  .showHelpAfterError()
  .action(() => {
    program.help();
  })
  .addHelpCommand(false)
  .enablePositionalOptions()
  .passThroughOptions();

// ------------- Add things that mutate the program ----------
ConfigureHelp(program);
SendCommand(program);
ComposeCommand(program);
RenderersCommand(program);
SetupCommand(program);
_DevCommand(program);

// ------------- Execute the program ----------
program.parse(process.argv);