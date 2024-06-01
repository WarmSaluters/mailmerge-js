import { Email } from "../lib/types";
import chalk from "chalk";
import { marked } from "marked";
import readline from "readline";


export class EmailPreviewer {
  private index: number;
  private linesWritten: number = 0;

  constructor(private emails: Email[]) {
    this.emails = emails;
    this.index = 0;
  }

  get current() {
    return this.emails[this.index];
  }

  show() {
    return new Promise<void>((resolve, reject) => {
      this.render();

      // Create readline interface
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // Function to handle key press
      // @ts-expect-error typescript wonkiness
      rl.input.on("keypress", (str: string, key: any) => {
        // You can add your logic here to handle the key press
        if (key.sequence === "\u0003") {
          // Ctrl+C to exit
          rl.close();
          resolve();
        }

        if (key.name === "q") {
          rl.close();
          resolve();
        }

        if (key.name === "left") {
          this.index--;
          if (this.index < 0) {
            this.index = 0;
          }
          this.render();
        }

        if (key.name === "right") {
          this.index++;
          if (this.index >= this.emails.length) {
            this.index = this.emails.length - 1;
          }
          this.render();
        }
      });

      // Set the stdin to raw mode to detect key press immediately
      process.stdin.setRawMode(true);
      process.stdin.resume();
    });
  }

  render = () => {
    this.clearLines(this.linesWritten);
    const { content, lines } = this.renderEmailPreviewContent(
      this.current,
      this.index,
      this.emails.length
    );
    console.log(content);
    console.log(
      chalk.bold('Use "<-" to go back, "->" to go forward, "q" to exit.')
    );
    this.linesWritten = lines + 2;
  };

  renderEmailPreviewContent = (email: Email, index: number, total: number) => {
    const content = "\n" +
      `${chalk.bold(`-`.repeat(process.stdout.columns))}` +
      "\n" +
      chalk.bold(`Displaying email ${index + 1} of ${total}`) +
      "\n" +
      `${chalk.bold(`-`.repeat(process.stdout.columns))}` +
      "\n" +
      `${chalk.bold.cyan(`Subject: ${chalk.yellowBright(email.subject)}`)}\n` +
      `${chalk.bold.cyan(`To: ${chalk.yellowBright(email.to)}`)}\n\n` +
      marked.parse(email.body);

    const lines = content.split("\n").length;
    return { content, lines };
  };

  clearLines = (n: number) => {
    for (let i = 0; i < n; i++) {
      //first clear the current line, then clear the previous line
      const y = i === 0 ? null : -1;
      process.stdout.moveCursor(0, y as number);
      process.stdout.clearLine(1);
    }
    process.stdout.cursorTo(0);
  };
}
