"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteDocument } from "@/lib/documents/actions";

export function DeleteDocumentButton({
  documentId,
  title,
}: {
  documentId: string;
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    const confirmed = window.confirm(
      `Delete “${title}”? This can't be undone, and anyone it's shared with will lose access.`,
    );
    if (!confirmed) return;

    setBusy(true);
    const res = await deleteDocument(documentId);
    if (!res.ok) {
      toast.error(res.error);
      setBusy(false);
      return;
    }
    toast.success("Document deleted.");
    router.push("/documents");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={busy}>
      {busy ? "Deleting…" : "Delete"}
    </Button>
  );
}