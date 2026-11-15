"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createDocument } from "@/lib/documents/actions";
import { ImportError, parseFile } from "@/lib/import/parse-file";

export function ImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    try {
      const { title, content } = await parseFile(file);
      const res = await createDocument({ title, content });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Imported “${title}”`);
      router.push(`/documents/${res.data.id}`);
    } catch (err) {
      toast.error(err instanceof ImportError ? err.message : "Could not import that file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.markdown,.docx"
        className="hidden"
        onChange={onChange}
      />
      <Button variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? "Importing…" : "Import file"}
      </Button>
      <span className="text-xs text-muted-foreground">.txt, .md, .docx · max 4 MB</span>
    </div>
  );
}