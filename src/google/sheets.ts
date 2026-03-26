import { googleFetch } from "./auth";
import type { GoogleSheetResult, GoogleSheetTabResult } from "./types";

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function valuesToText(tabTitle: string, values: string[][]): string {
  if (!values.length) {
    return `Sheet: ${tabTitle}\n(Empty sheet)`;
  }

  const lines = values.map((row) => row.join(" | "));
  return `Sheet: ${tabTitle}\n${lines.join("\n")}`;
}

export async function readGoogleSheetById(
  spreadsheetId: string
): Promise<GoogleSheetResult> {
  const spreadsheet = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`
  );

  const title = spreadsheet.properties?.title ?? "Untitled Spreadsheet";
  const sheetMetas = spreadsheet.sheets ?? [];

  const sheets: GoogleSheetTabResult[] = [];

  for (const sheet of sheetMetas) {
    const tabTitle = sheet.properties?.title ?? "Untitled Sheet";
    const sheetId = sheet.properties?.sheetId ?? 0;

    const encodedRange = encodeURIComponent(tabTitle);
    const valuesData = await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`
    );

    const rawValues = Array.isArray(valuesData.values) ? valuesData.values : [];
    const values = rawValues.map((row: unknown[]) =>
      row.map((cell) => normalizeCellValue(cell))
    );

    sheets.push({
      sheetId,
      title: tabTitle,
      range: tabTitle,
      values,
    });
  }

  const content = sheets
    .map((tab) => valuesToText(tab.title, tab.values))
    .join("\n\n---\n\n");

  return {
    spreadsheetId,
    title,
    sheets,
    content,
  };
}