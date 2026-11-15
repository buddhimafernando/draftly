import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listDocuments } from "@/lib/documents/queries";
import { DocumentList } from "@/components/dashboard/document-list";
import { NewDocumentButton } from "@/components/dashboard/new-document-button";
import { ImportButton } from "@/components/dashboard/import-button";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const docs = await listDocuments(user.id);
  const owned = docs.filter((d) => d.role === "owner");
  const shared = docs.filter((d) => d.role !== "owner");

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold">Documents</h1>
        <div className="flex items-start gap-2">
          <ImportButton />
          <NewDocumentButton />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">My documents</h2>
        <DocumentList items={owned} emptyText="No documents yet. Create one or import a file." />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Shared with me</h2>
        <DocumentList items={shared} emptyText="Nothing has been shared with you yet." showOwner />
      </section>
    </div>
  );
}