#!/usr/bin/env node
import { Command } from "commander";
import DraftAndSendCommand from "./cmd.draft-and-send.js";
import DraftCommand from "./cmd.draft.js";
import SendCommand from "./cmd.send.js";
import SetupCommand from "./cmd.setup.js";
import ConfigureHelp from "./help.js";
import _DevCommand from "./cmd.dev.js";

import packageJSON from "../../package.json" assert { type: "json" };

const program = new Command();
program
  .name(packageJSON.name)
  .version(packageJSON.version)
  .description(packageJSON.description)
  .action(() => {
    program.help();
  })
  .addHelpCommand(false)
  .enablePositionalOptions()
  .passThroughOptions();

// ------------- Add things that mutate the program ----------
ConfigureHelp(program);
SendCommand(program);
DraftCommand(program);
DraftAndSendCommand(program);
SetupCommand(program);
_DevCommand(program);

// ------------- Execute the program ----------
program.parse(process.argv);
