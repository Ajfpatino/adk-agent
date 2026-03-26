import fs from "node:fs/promises";
import { google } from "googleapis";
import { TOKEN_PATH, CREDENTIALS_PATH } from "../utils/constants";

export async function getAccessToken(): Promise<string> {
  const [tokenRaw, credentialsRaw] = await Promise.all([
    fs.readFile(TOKEN_PATH, "utf8"),
    fs.readFile(CREDENTIALS_PATH, "utf8"),
  ]);

  const token = JSON.parse(tokenRaw);
  const credentials = JSON.parse(credentialsRaw);

  const clientConfig = credentials.installed ?? credentials.web;

  if (!clientConfig) {
    throw new Error(
      "credentials.json must contain either 'installed' or 'web' OAuth config."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientConfig.client_id,
    clientConfig.client_secret,
    clientConfig.redirect_uris?.[0]
  );

  oauth2Client.setCredentials(token);

  const tokenResponse = await oauth2Client.getAccessToken();
  const accessToken =
    typeof tokenResponse === "string"
      ? tokenResponse
      : tokenResponse?.token;

  if (!accessToken) {
    throw new Error("Failed to obtain Google access token.");
  }

  return accessToken;
}

export async function googleFetch(url: string): Promise<any> {
  const accessToken = await getAccessToken();

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Google API request failed: ${response.status}`);
  }

  return response.json();
}