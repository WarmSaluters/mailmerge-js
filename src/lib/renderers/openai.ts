import { requestLLM } from "../openai.js";
import { BaseRenderer, RenderInputOptions, RenderResponse } from "./base.js";

export class OpenAIChatRenderer implements BaseRenderer {
    model: string;

    constructor (model: string) {
        this.model = model;
    }

    async render (templateContents: string, contactsContents: string, options: RenderInputOptions): Promise<RenderResponse> {
        const response = await mailMergeAIBulk(
            templateContents,
            contactsContents,
            this.model,
            {
              limit: options.limit,
            }
          );
          const responseJSON = JSON.parse(response ?? "{}");
          return {
            emails: responseJSON.emails ?? [],
            warnings: responseJSON.warnings ?? [],
          };
    }
}

export const mailMergeAIBulk = async (
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
      content: "You are an intelligent email drafting tool for performing mail merges. You are given a list of contacts and an email template. You are asked to generate a list of emails.",
    },
    { role: "user", content: formatted },
  ];

  const response = await requestLLM(messages, { model });
  return response;
};

const gptPrompt = `
    You are an intelligent email drafting tool for performing mail merges. You are given a list of contacts and an email template. You are asked to generate a list of emails.

    The contacts list may include fields like name, email, phone, etc. 

    The email template may include placeholders for the contact's name, email, phone, etc. 
    Placeholders in the email template are indicated by {{ }} delimters.

    The email template may also include user-specified directives for the AI to follow.
    Directives are indicated by << >> delimters.

    NOTE: The mail template variables may not match the contact fields exactly and you may need to perform some data mapping. Additionally if there are gaps that cannot be filled
    by the contact data you may need to tweak the message to accommodate for missing data. You should also smooth out any discrepancies in grammar introduced by plugging the fields in.

    IMPORTANT: Unless explicitly given direction to do so or only for fixing grammar, DO NOT change the user's content or you will be penalized.

    Return your answer in the following JSON format (the body should be formatted as markdown regardless of the template).
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
