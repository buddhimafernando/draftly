import { notFound, redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { createClient } from "@/lib/supabase/server";
import { getDocument, listCollaborators } from "@/lib/documents/queries";
import { DocumentEditor } from "@/components/editor/editor";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const doc = await getDocument(id, user.id);
  if (!doc) notFound(); // same response for "doesn't exist" and "no access"

  const collaborators = doc.role === "owner" ? await listCollaborators(id) : [];

  return (
    <DocumentEditor
      key={id}
      id={doc.id}
      initialTitle={doc.title}
      initialContent={doc.content as unknown as JSONContent}
      role={doc.role}
      ownerName={doc.ownerName}
      collaborators={collaborators}
    />
  );
}