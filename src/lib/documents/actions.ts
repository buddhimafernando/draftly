"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };

const MAX_CONTENT_CHARS = 2_000_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}
function fail(error: string): Result<never> {
  return { ok: false, error };
}

function parseTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const title = raw.trim();
  return title.length >= 1 && title.length <= 200 ? title : null;
}

function parseContent(raw: unknown): Json | null {
  if (typeof raw !== "object" || raw === null) return null;
  if ((raw as { type?: unknown }).type !== "doc") return null;
  try {
    if (JSON.stringify(raw).length > MAX_CONTENT_CHARS) return null;
  } catch {
    return null;
  }
  return raw as Json;
}

export async function createDocument(input?: {
  title?: string;
  content?: unknown;
}): Promise<Result<{ id: string }>> {
  const title = parseTitle(input?.title ?? "Untitled document");
  if (!title) return fail("Title must be 1–200 characters.");

  let content: Json | undefined;
  if (input?.content !== undefined) {
    const parsed = parseContent(input.content);
    if (!parsed) return fail("That document content is invalid or too large.");
    content = parsed;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please sign in again.");

  const { data, error } = await supabase
    .from("documents")
    .insert({ owner_id: user.id, title, ...(content !== undefined ? { content } : {}) })
    .select("id")
    .single();
  if (error || !data) return fail("Could not create the document.");
  return ok({ id: data.id });
}

export async function renameDocument(id: string, rawTitle: string): Promise<Result> {
  const title = parseTitle(rawTitle);
  if (!title) return fail("Title must be 1–200 characters.");
  if (!UUID_RE.test(id)) return fail("Document not found.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .update({ title })
    .eq("id", id)
    .select("id");
  if (error) return fail("Could not rename the document.");
  if (!data || data.length === 0) return fail("You don't have permission to edit this document.");
  return ok(null);
}

export async function saveDocument(id: string, rawContent: unknown): Promise<Result> {
  const content = parseContent(rawContent);
  if (!content) return fail("Document content is invalid or too large.");
  if (!UUID_RE.test(id)) return fail("Document not found.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .update({ content })
    .eq("id", id)
    .select("id");
  if (error) return fail("Could not save your changes.");
  if (!data || data.length === 0) return fail("You don't have permission to edit this document.");
  return ok(null);
}

export async function shareDocument(
  documentId: string,
  email: string,
  role: string,
): Promise<Result> {
  if (!UUID_RE.test(documentId)) return fail("Document not found.");
  const cleanEmail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) return fail("Enter a valid email address.");
  if (role !== "viewer" && role !== "editor") return fail("Choose viewer or editor.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("share_document", {
    p_document_id: documentId,
    p_email: cleanEmail,
    p_role: role,
  });
  if (error) {
    const known = ["42501", "P0002", "22023"];
    return fail(known.includes(error.code) ? error.message : "Could not share the document.");
  }
  return ok(null);
}

export async function removeShare(documentId: string, userId: string): Promise<Result> {
  if (!UUID_RE.test(documentId) || !UUID_RE.test(userId)) return fail("Invalid request.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_shares")
    .delete()
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .select("user_id");
  if (error) return fail("Could not remove access.");
  if (!data || data.length === 0) return fail("Nothing to remove.");
  return ok(null);
}

export async function deleteDocument(id: string): Promise<Result> {
  if (!UUID_RE.test(id)) return fail("Document not found.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return fail("Could not delete the document.");
  if (!data || data.length === 0) return fail("Only the owner can delete this document.");
  return ok(null);
}