import { Command } from "commander";
import { getCurrentMailbox } from "../lib/gmail.js";
import { authorize } from "../lib/google-auth.js";

export default function _DevCommand(program: Command) {
  const root = program
    .command("dev", { hidden: true})
    .description("Misc dev tools")

  root.command('test-auth')
    .description('Test the tokens')
    .action(testAuth);
}


const testAuth = async () => {
    const auth = await authorize('local');
    const mailbox = await getCurrentMailbox(auth);
    console.log(mailbox);
}