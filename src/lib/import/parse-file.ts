import { generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";
import type { JSONContent } from "@tiptap/react";

export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".markdown", ".docx"];
export const MAX_IMPORT_BYTES = 4 * 1024 * 1024;

export class ImportError extends Error {}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textToHtml(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

export async function parseFile(file: File): Promise<{ title: string; content: JSONContent }> {
  const dot = file.name.lastIndexOf(".");
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new ImportError("Unsupported file type. Use .txt, .md or .docx.");
  }
  if (file.size === 0) throw new ImportError("That file is empty.");
  if (file.size > MAX_IMPORT_BYTES) throw new ImportError("File is too large (max 4 MB).");

  let html: string;
  if (ext === ".docx") {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/import/docx", { method: "POST", body });
    const json = (await res.json().catch(() => null)) as { html?: string; error?: string } | null;
    if (!res.ok || typeof json?.html !== "string") {
      throw new ImportError(json?.error ?? "Could not read that .docx file.");
    }
    html = json.html;
  } else if (ext === ".txt") {
    html = textToHtml(await file.text());
  } else {
    html = marked.parse(await file.text(), { async: false }) as string;
  }

  // Parsing through the editor schema drops anything the editor doesn't support (scripts, images, etc.).
  const content = generateJSON(html, [StarterKit]) as JSONContent;
  const title = file.name.replace(/\.[^.]+$/, "").trim().slice(0, 200) || "Imported document";
  return { title, content };
}