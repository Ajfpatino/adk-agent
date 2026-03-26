import { getAccessToken, googleFetch } from "./auth";
import { readGoogleDocById } from "./docs";
import { readGoogleSheetById } from "./sheets";
import type { DriveItem, FolderReadableResult } from "./types";

export async function getDriveItemMetadata(fileId: string): Promise<DriveItem> {
  const data = await googleFetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType&supportsAllDrives=true`
  );

  if (!data.id || !data.name || !data.mimeType) {
    throw new Error("Failed to retrieve Google Drive file metadata.");
  }

  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType,
  };
}

export async function listFolderContents(folderId: string): Promise<DriveItem[]> {
  const accessToken = await getAccessToken();
  const allFiles: DriveItem[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", `'${folderId}' in parents and trashed = false`);
    url.searchParams.set("fields", "nextPageToken,files(id,name,mimeType)");
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("includeItemsFromAllDrives", "true");
    url.searchParams.set("supportsAllDrives", "true");

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Drive list error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    for (const file of data.files ?? []) {
      if (file.id && file.name && file.mimeType) {
        allFiles.push({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
        });
      }
    }

    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);

  return allFiles;
}

export async function collectReadableFilesFromFolder(
  folderId: string,
  currentPath = ""
): Promise<FolderReadableResult[]> {
  const items = await listFolderContents(folderId);
  const results: FolderReadableResult[] = [];

  for (const item of items) {
    const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;

    if (item.mimeType === "application/vnd.google-apps.folder") {
      const nested = await collectReadableFilesFromFolder(item.id, itemPath);
      results.push(...nested);
      continue;
    }

    if (item.mimeType === "application/vnd.google-apps.document") {
      const doc = await readGoogleDocById(item.id);
      results.push({
        ...doc,
        path: itemPath,
      });
      continue;
    }

    if (item.mimeType === "application/vnd.google-apps.spreadsheet") {
      const sheet = await readGoogleSheetById(item.id);
      results.push({
        ...sheet,
        path: itemPath,
      });
    }
  }

  return results;
}