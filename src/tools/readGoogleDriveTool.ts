import { FunctionTool } from "@google/adk";
import { z } from "zod";
import {
  extractDocId,
  extractSheetId,
  extractDriveFileId,
  extractDriveFolderId,
  looksLikePlainGoogleId,
} from "../google/extractors";
import { readGoogleDocById } from "../google/docs";
import { readGoogleSheetById } from "../google/sheets";
import {
  collectReadableFilesFromFolder,
  getDriveItemMetadata,
} from "../google/drive";

export const readGoogleDriveTool = new FunctionTool({
  name: "read_google_drive",
  description:
    "Reads a Google Doc, Google Sheet, Google Drive file, or Google Drive folder. If a folder is provided, it finds Google Docs and Google Sheets inside it and reads them.",
  parameters: z.object({
    driveUrlOrId: z
      .string()
      .describe(
        "A Google Docs URL, Google Sheets URL, Drive file URL, Drive folder URL, or Google file/folder ID."
      ),
  }),
  execute: async ({ driveUrlOrId }) => {
    try {
      const folderId = extractDriveFolderId(driveUrlOrId);

      if (folderId) {
        const files = await collectReadableFilesFromFolder(folderId);

        return {
          status: "success",
          type: "folder",
          folderId,
          totalFiles: files.length,
          files,
        };
      }

      const docId = extractDocId(driveUrlOrId);
      if (docId) {
        const doc = await readGoogleDocById(docId);

        return {
          status: "success",
          type: "document",
          ...doc,
        };
      }

      const sheetId = extractSheetId(driveUrlOrId);
      if (sheetId) {
        const sheet = await readGoogleSheetById(sheetId);

        return {
          status: "success",
          type: "spreadsheet",
          ...sheet,
        };
      }

      const possibleFileId =
        extractDriveFileId(driveUrlOrId) ||
        (looksLikePlainGoogleId(driveUrlOrId) ? driveUrlOrId : null);

      if (!possibleFileId) {
        throw new Error(
          "Could not determine whether the input is a Google Doc, Google Sheet, Drive file, or Drive folder."
        );
      }

      const metadata = await getDriveItemMetadata(possibleFileId);

      if (metadata.mimeType === "application/vnd.google-apps.folder") {
        const files = await collectReadableFilesFromFolder(metadata.id);

        return {
          status: "success",
          type: "folder",
          folderId: metadata.id,
          folderName: metadata.name,
          totalFiles: files.length,
          files,
        };
      }

      if (metadata.mimeType === "application/vnd.google-apps.document") {
        const doc = await readGoogleDocById(metadata.id);

        return {
          status: "success",
          type: "document",
          ...doc,
        };
      }

      if (metadata.mimeType === "application/vnd.google-apps.spreadsheet") {
        const sheet = await readGoogleSheetById(metadata.id);

        return {
          status: "success",
          type: "spreadsheet",
          ...sheet,
        };
      }

      return {
        status: "error",
        message: `The provided Drive item is not a Google Doc, Google Sheet, or folder. Found mimeType: ${metadata.mimeType}`,
      };
    } catch (error: any) {
      return {
        status: "error",
        message: error?.message ?? "Failed to read from Google Drive.",
      };
    }
  },
});