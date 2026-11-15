import { createClient } from "@/lib/supabase/server";
import type { Collaborator, Role } from "@/types";

type Profile = { display_name: string; email: string };

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function nameOf(profile: Profile | Profile[] | null): string {
  const p = one(profile);
  return p?.display_name || p?.email || "Unknown";
}

export type DocumentListItem = {
  id: string;
  title: string;
  updatedAt: string;
  ownerName: string;
  role: Role;
};

export async function listDocuments(userId: string): Promise<DocumentListItem[]> {
  const supabase = await createClient();
  const [docs, shares] = await Promise.all([
    supabase
        .from("documents")
        .select(
            "id, title, updated_at, owner_id, owner:profiles!documents_owner_id_fkey(display_name, email)",
        )
        .order("updated_at", { ascending: false }),
    supabase.from("document_shares").select("document_id, role").eq("user_id", userId),
  ]);
    if (docs.error) {
    console.error("listDocuments failed:", docs.error);
    throw new Error("Could not load documents.");
    }

  const roleByDoc = new Map(
    (shares.data ?? []).map((s): [string, Role] => [s.document_id, s.role as Role]),
  );

  return (docs.data ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    updatedAt: d.updated_at,
    ownerName: nameOf(d.owner),
    role: d.owner_id === userId ? "owner" : (roleByDoc.get(d.id) ?? "viewer"),
  }));
}

export async function getDocument(id: string, userId: string) {
  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, title, content, owner_id, owner:profiles!documents_owner_id_fkey(display_name, email)")
    .eq("id", id)
    .maybeSingle();
  if (error || !doc) return null;

  let role: Role = "owner";
  if (doc.owner_id !== userId) {
    const { data: share } = await supabase
      .from("document_shares")
      .select("role")
      .eq("document_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    role = share?.role === "editor" ? "editor" : "viewer";
  }

  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    role,
    ownerName: nameOf(doc.owner),
  };
}

export async function listCollaborators(documentId: string): Promise<Collaborator[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("document_shares")
    .select("user_id, role, profile:profiles!document_shares_user_id_fkey(display_name, email)")
    .eq("document_id", documentId);

  return (data ?? []).map((s) => {
    const p = one(s.profile);
    return {
      userId: s.user_id,
      email: p?.email ?? "",
      name: p?.display_name || p?.email || "Unknown",
      role: s.role as Collaborator["role"],
    };
  });
}