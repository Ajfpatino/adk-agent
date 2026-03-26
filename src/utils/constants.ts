import path from "node:path";
import process from "node:process";

export const TOKEN_PATH = path.join(process.cwd(), "token.json");
export const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");