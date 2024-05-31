import { getMockEmails } from "../mocks.js";
import { BaseRenderer, RenderInputOptions } from "./base.js";

export class MockRenderer implements BaseRenderer {
  async render(template: string, contacts: string, options: RenderInputOptions) {
    return getMockEmails();
  }
}

