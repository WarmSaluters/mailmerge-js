import fs from "fs";

export const getFileContents = async (file: string) => {
  return fs.readFileSync(file, "utf8");
};
