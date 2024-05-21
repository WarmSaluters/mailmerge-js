import { Command } from "commander";
import { initateAuth, sendEmail } from "../lib/gmail.js";

export default function SendCommand(program: Command) {
  program
    .command("send")
    .description("Send a message to a list of recipients")
    .action(async () => {
      console.log("Todo: Send a message to a list of recipients");
      const auth = await initateAuth();
      const draftId = await sendEmail(
        auth,
        "ryanhuang519@gmail.com",
        "test subject",
        "test message"
      );
      console.log("Draft Id: ", draftId);
    });
}
