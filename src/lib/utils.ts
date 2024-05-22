import fs from "fs";

export const getFileContents = async (file: string) => {
  return fs.readFileSync(file, "utf8");
};

export const writeJSON = (file: string, data: any) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};