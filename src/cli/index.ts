#!/usr/bin/env node
import { Command } from "commander";
import DraftAndSendCommand from "./cmd.draft-and-send.js";
import DraftCommand from "./cmd.draft.js";
import SendCommand from "./cmd.send.js";
import SetupCommand from "./cmd.setup.js";
import ConfigureHelp from "./help.js";
import _DevCommand from "./cmd.dev.js";

const program = new Command();

program
  .name("mailmerge")
  .version("1.0.0")
  .description("A simple CLI for mail merge.")
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
