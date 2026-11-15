"use client";

import { useState } from "react";
import Link from "next/link";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";
import { renameDocument, saveDocument } from "@/lib/documents/actions";
import { useAutosave, type SaveStatus } from "@/hooks/use-autosave";
import { Toolbar } from "@/components/editor/toolbar";
import { ShareDialog } from "@/components/sharing/share-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Collaborator, Role } from "@/types";
import { DeleteDocumentButton } from "@/components/editor/delete-button";

const STATUS_LABEL: Record<SaveStatus, string> = {
  saved: "All changes saved",
  saving: "Saving…",
  unsaved: "Unsaved changes",
  error: "Couldn't save. Will retry on your next edit",
};

type Props = {
  id: string;
  initialTitle: string;
  initialContent: JSONContent;
  role: Role;
  ownerName: string;
  collaborators: Collaborator[];
};

export function DocumentEditor({ id, initialTitle, initialContent, role, ownerName, collaborators }: Props) {
  const canEdit = role !== "viewer";
  const [title, setTitle] = useState(initialTitle);
  const [savedTitle, setSavedTitle] = useState(initialTitle);

  const { status, schedule } = useAutosave<JSONContent>(async (content) => {
    const res = await saveDocument(id, content);
    if (!res.ok) toast.error(res.error);
    return res;
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editable: canEdit,
    immediatelyRender: false, // avoids SSR hydration mismatch
    onUpdate: ({ editor }) => schedule(editor.getJSON()),
  });

  async function commitTitle() {
    const next = title.trim();
    if (next === savedTitle) {
      setTitle(savedTitle);
      return;
    }
    if (!next) {
      toast.error("Title can't be empty.");
      setTitle(savedTitle);
      return;
    }
    const res = await renameDocument(id, next);
    if (!res.ok) {
      toast.error(res.error);
      setTitle(savedTitle);
      return;
    }
    setSavedTitle(next);
    setTitle(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/documents" className="text-sm text-muted-foreground hover:underline">
          ← All documents
        </Link>
        <div className="flex items-center gap-3">
          {canEdit && (
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {STATUS_LABEL[status]}
            </span>
          )}
        {role === "owner" ? (
        <>
            <ShareDialog documentId={id} collaborators={collaborators} />
            <DeleteDocumentButton documentId={id} title={savedTitle} />
        </>
        ) : (
        <Badge variant="secondary">{role === "editor" ? "Can edit" : "View only"}</Badge>
        )}
        </div>
      </div>

      <div className="space-y-1">
        <Input
          value={title}
          maxLength={200}
          readOnly={!canEdit}
          aria-label="Document title"
          className="h-auto border-0 px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
        {role !== "owner" && (
          <p className="text-sm text-muted-foreground">Shared by {ownerName}</p>
        )}
      </div>

      {canEdit && editor && <Toolbar editor={editor} />}

      <div className="rounded-md border p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}