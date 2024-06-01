import { Renderer, RenderInputOptions } from "./base.js";
import { OllamaClient } from "../ollama.js";
import chalk from "chalk";

export class OllamaRenderer implements Renderer {
  model: string;

  constructor(model: string) {
    this.model = model;
  }

  async render(template: string, contacts: string, options: RenderInputOptions) {
    return mailMergeAIBulk(template, contacts, this.model, options);
  }
}

const mailMergeAIBulk = async (
  template: string,
  contacts: string,
  model: string,
  options?: { limit?: number; }
) => {
  const formatted = gptPrompt
    .replace(/!TEMPLATE!/g, template)
    .replace(/!CONTACTS!/g, contacts)
    .replace(/!LIMIT!/g, options?.limit?.toString() ?? "None");
  const messages = [
    {
      role: "system",
      content: "You are an intelligent email drafting tool for performing mail merges. You are given a list of contacts and an email template. You are asked to generate a list of emails. ONLY RETURN IN JSON",
    },
    { role: "user", content: formatted },
  ];

  const response = await new OllamaClient().requestLLM(messages, { model });
  
  try {
    const content = JSON.parse(response?.message?.content ?? "");
    return content;
  } catch (error) {
    console.log(chalk.red("[!] Error parsing response:"), error);
  }
};

const gptPrompt = `
    You are an intelligent email drafting tool for performing mail merges. You are given a list of contacts and an email template. You are asked to generate a list of emails.

    The contacts list may include fields like name, email, phone, etc. 

    The email template may include placeholders for the contact's name, email, phone, etc. Sometimes this may contain directives from the user.
    Placeholders in the email template are indicated by {{ }} delimters.

    NOTE: The mail template variables may not match the contact fields exactly and you may need to perform some data mapping. Additionally if there are gaps that cannot be filled
    by the contact data you may need to tweak the message to accommodate for missing data. You should also smooth out any discrepancies in grammar introduced by plugging the fields in.

    IMPORTANT: Unless explicitly given direction to do so or only for fixing grammar, DO NOT change the user's content or you will be penalized.

    Return ONLY your answer in the following JSON format (the body should be formatted as markdown regardless of the template).
    {
        "emails": [
            {
                "to": "email@example.com",
                "subject": "Hello, {{ contact.name }}",
                "body": "Hello, {{ contact.name }}. This is a test email."
            }
        ],
        "warnings": <Any warnings or errors to surface to user as a list>
    }


    # TEMPLATE
    !TEMPLATE!


    # CONTACTS
    !CONTACTS!

    # LIMIT
    !LIMIT!
`;
