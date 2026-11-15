"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removeShare, shareDocument } from "@/lib/documents/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Collaborator, ShareRole } from "@/types";

const selectClass = "h-9 rounded-md border bg-background px-2 text-sm";

export function ShareDialog({
  documentId,
  collaborators,
}: {
  documentId: string;
  collaborators: Collaborator[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("viewer");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await shareDocument(documentId, email, role);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Access granted.");
    setEmail("");
    router.refresh();
  }

  async function changeRole(c: Collaborator, next: ShareRole) {
    const res = await shareDocument(documentId, c.email, next);
    if (!res.ok) toast.error(res.error);
    router.refresh();
  }

  async function onRemove(c: Collaborator) {
    const res = await removeShare(documentId, c.userId);
    if (!res.ok) toast.error(res.error);
    else toast.success("Access removed.");
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Share
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share document</DialogTitle>
            <DialogDescription>
              Viewers can read. Editors can read and edit. Only you can manage sharing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="flex gap-2">
            <Input
              type="email"
              required
              placeholder="person@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
            />
            <select
              className={selectClass}
              value={role}
              onChange={(e) => setRole(e.target.value as ShareRole)}
              aria-label="Role"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <Button type="submit" disabled={busy}>
              {busy ? "…" : "Share"}
            </Button>
          </form>

          <div className="space-y-2">
            <p className="text-sm font-medium">People with access</p>
            {collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground">Only you.</p>
            ) : (
              <ul className="space-y-2">
                {collaborators.map((c) => (
                  <li key={c.userId} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className={selectClass}
                        value={c.role}
                        onChange={(e) => changeRole(c, e.target.value as ShareRole)}
                        aria-label={`Role for ${c.name}`}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <Button variant="ghost" size="sm" onClick={() => onRemove(c)}>
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}