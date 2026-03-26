import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/documents.readonly", "https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/spreadsheets.readonly"];
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH, "utf8");
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH, "utf8");
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;

  if (!key) {
    throw new Error("credentials.json must contain an installed or web client.");
  }

  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });

  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) return client;

  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  if (client.credentials?.refresh_token) {
    await saveCredentials(client);
  } else {
    console.warn("No refresh token received.");
  }

  return client;
}

function extractDocId(input) {
  const match = input.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : input;
}

function extractTextFromDoc(data) {
  let text = "";

  for (const item of data.body?.content ?? []) {
    if (!item.paragraph?.elements) continue;

    for (const el of item.paragraph.elements) {
      if (el.textRun?.content) {
        text += el.textRun.content;
      }
    }
  }

  return text.trim();
}

async function main() {
  const auth = await authorize();
  const docs = google.docs({ version: "v1", auth });

  const input = process.argv[2];
  if (!input) {
    throw new Error("Please provide a Google Docs URL or document ID.");
  }

  const documentId = extractDocId(input);

  const res = await docs.documents.get({ documentId });
  console.log("\nDOCUMENT CONTENT:\n");
  console.log(extractTextFromDoc(res.data));
}

main().catch((err) => {
  console.error("ERROR:", err);
});