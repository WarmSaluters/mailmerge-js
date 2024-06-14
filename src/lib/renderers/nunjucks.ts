import { Renderer, RenderInputOptions } from "./base.js";
import nunjucks from "nunjucks";
import { parse } from "csv-parse/sync";

export class NunjucksRenderer implements Renderer {
  template: string;

  constructor(template: string) {
    this.template = template;
  }

  async render(
    template: string,
    contacts: string,
    options: RenderInputOptions
  ) {
    const contactsArray = parseCSV(contacts);
    return mailMergeNunjucks(template, contactsArray, options);
  }
}

const parseCSV = (csvContent: string) => {
  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });
};

const mailMergeNunjucks = (
  template: string,
  contactsArray: any[],
  options?: { limit?: number }
) => {
  const limit = options?.limit ?? contactsArray.length;
  const emails = [];

  for (let i = 0; i < limit; i++) {
    const contact = contactsArray[i];
    const email = nunjucks.renderString(template, contact);
    emails.push({
      to: contact.email,
      subject: nunjucks.renderString("{{ subject }}", contact),
      body: email,
    });
  }

  return {
    emails,
    warnings: [],
  };
};
