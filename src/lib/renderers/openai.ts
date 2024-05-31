import { mailMergeAIBulk } from "../mail-merge.js";
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