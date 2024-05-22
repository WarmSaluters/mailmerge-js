import fs from "fs";
import path from "path";

type IConfig = {
  openaiAPIKey?: string;
  gmailToken?: string;
  googleCredentialsJSON?: string;
  currentMailbox?: string;
};

const DEFAULT_CONFIG_FILE = "~/.mailmerge/config.json".replace(
  "~",
  process.env.HOME ?? ""
);

export const deleteConfigFile = () => {
  fs.unlinkSync(DEFAULT_CONFIG_FILE);
};

export const updateConfigFile = (
  config: IConfig,
  file: string = DEFAULT_CONFIG_FILE
) => {
  // Create if not exist
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(config));
};

export const readConfigFile = (file: string = DEFAULT_CONFIG_FILE) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return {};
  }
};

export const loadConfig = () => {
  const config = readConfigFile();

  const loaded = {
    openaiAPIKey: config.openaiAPIKey,
    gmailToken: config.gmailToken,
    googleCredentialsJSON: config.googleCredentialsJSON,
    currentMailbox: config.currentMailbox,
  } as IConfig;

  // Repair broken token
  if (loaded.gmailToken && !loaded.gmailToken.includes("refresh")) {
    loaded.gmailToken = undefined
  }

  return loaded;
};

export const Config = loadConfig();
export default Config;
