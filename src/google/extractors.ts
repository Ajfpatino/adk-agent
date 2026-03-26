export function extractDocId(input: string): string | null {
  const match = input.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export function extractSheetId(input: string): string | null {
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export function extractDriveFolderId(input: string): string | null {
  const match = input.match(/\/drive\/folders\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];

  const openMatch = input.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  return openMatch ? openMatch[1] : null;
}

export function extractDriveFileId(input: string): string | null {
  const fileMatch = input.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (fileMatch) return fileMatch[1];

  const docId = extractDocId(input);
  if (docId) return docId;

  const sheetId = extractSheetId(input);
  if (sheetId) return sheetId;

  const openMatch = input.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  return openMatch ? openMatch[1] : null;
}

export function looksLikePlainGoogleId(input: string): boolean {
  return /^[a-zA-Z0-9-_]{20,}$/.test(input);
}