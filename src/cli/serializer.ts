import { Email } from "../lib/types.js";
import { writeJSON } from "../lib/utils.js";
import { v4 as uuidv4 } from 'uuid';
import fs from "node:fs";

export class EmailSerializer {

    constructor(private readonly draftsPath: string) {
        this.draftsPath = draftsPath;
    }

    async serialize(emails: Email[]) {
        fs.mkdirSync(this.draftsPath, { recursive: true });
        for (const email of emails) {
            const uniqueId = 'draft-' + uuidv4();
            writeJSON(`${this.draftsPath}/${uniqueId}.json`, email);
        }
    }

    async deserialize() : Promise<Email[]> {
        const isDir = fs.lstatSync(this.draftsPath).isDirectory();
        if (isDir) {
            const files = fs.readdirSync(this.draftsPath);
            const emails = files.map(file => {
                const email = fs.readFileSync(`${this.draftsPath}/${file}`, 'utf8');
                return JSON.parse(email);
            });
            return emails;
        } else {
            const email = fs.readFileSync(this.draftsPath, 'utf8');
            return [JSON.parse(email)];
        }
    }

}

