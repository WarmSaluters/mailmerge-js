import { Command } from "commander";
import { sendEmail } from "../lib/gmail.js";
import { authorize } from "../lib/google-auth.js";

export default function SendCommand(program: Command) {
  program
    .command("send")
    .description("Send a message to a list of recipients")
    .action(async () => {
      console.log("Todo: Send a message to a list of recipients");
      const auth = await authorize();
      const draftId = await sendEmail(
        auth,
        "ryanhuang519@gmail.com",
        "test subject",
        "test message"
      );
      console.log("Draft Id: ", draftId);
    });
}
