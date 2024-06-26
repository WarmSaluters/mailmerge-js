import { Email } from "../types.js";
import { Renderer, RenderInputOptions } from "./base.js";

export class MockRenderer implements Renderer {
  async render(template: string, contacts: string, options: RenderInputOptions) {
    return getMockEmails();
  }
}

const mockResponse = `{
    "emails": [
        {
            "to": "test@gmail.com",
            "subject": "Hello",
            "body": "Hello, I found your email test@gmail.com. \\n Thanks."
        },
        {
            "to": "example@exmaple.com",
            "subject": "Hi",
            "body": "Hi, I found your email example@example.com. \\n Thanks."
        }
    ],
    "warnings": ["This is a mock response"]
}
`;

export const getMockEmails = (): { emails: Email[]; warnings: string[]; } => {
  const responseJSON = JSON.parse(mockResponse);
  return {
    emails: responseJSON.emails ?? [],
    warnings: responseJSON.warnings ?? [],
  };
};

