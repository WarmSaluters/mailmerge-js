import fs from 'fs';

type IConfig = {
    openaiAPIKey?: string;
    gmailToken?: string;
}

const DEFAULT_CONFIG_FILE = '~/.mailmerge/config.json';

export const updateConfigFile = (config: IConfig, file: string=DEFAULT_CONFIG_FILE) => {
    fs.writeFileSync(file, JSON.stringify(config));
    Config.gmailToken = config.gmailToken;
    Config.openaiAPIKey = config.openaiAPIKey;
}

export const readConfigFile = (file: string=DEFAULT_CONFIG_FILE) => {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        return {};
    }
}

export const loadConfig = () => {
    const config = readConfigFile();
    return {
        openaiAPIKey: process.env.OPENAI_API_KEY ?? config.openaiAPIKey,
        gmailToken: process.env.GMAIL_TOKEN ?? config.gmailToken,
    } as IConfig;
}

export const Config = loadConfig();
export default Config;
