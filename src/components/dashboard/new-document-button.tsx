"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createDocument } from "@/lib/documents/actions";

export function NewDocumentButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    const res = await createDocument();
    if (!res.ok) {
      toast.error(res.error);
      setBusy(false);
      return;
    }
    router.push(`/documents/${res.data.id}`);
  }

  return (
    <Button onClick={onClick} disabled={busy}>
      {busy ? "Creating…" : "New document"}
    </Button>
  );
}