export type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
};

export type GoogleDocResult = {
  documentId: string;
  title: string;
  content: string;
};

export type GoogleSheetTabResult = {
  sheetId: number;
  title: string;
  range: string;
  values: string[][];
};

export type GoogleSheetResult = {
  spreadsheetId: string;
  title: string;
  sheets: GoogleSheetTabResult[];
  content: string;
};

export type FolderDocResult = GoogleDocResult & {
  path: string;
};

export type FolderSheetResult = GoogleSheetResult & {
  path: string;
};

export type FolderReadableResult = FolderDocResult | FolderSheetResult;