import { Email } from "../types.js";

export type RenderInputOptions = {
    limit: number;
}

export type RenderResponse = {
    emails: Email[];
    warnings: string[];
}

export interface BaseRenderer {
    render (templateContents: string, contactsContents: string, options: RenderInputOptions): Promise<RenderResponse>;
}



