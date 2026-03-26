import { googleFetch } from "./auth";
import type { GoogleDocResult } from "./types";

export function extractTextFromDoc(data: any): string {
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

export async function readGoogleDocById(documentId: string): Promise<GoogleDocResult> {
  const data = await googleFetch(
    `https://docs.googleapis.com/v1/documents/${documentId}`
  );

  return {
    documentId,
    title: data.title ?? "Untitled",
    content: extractTextFromDoc(data),
  };
}