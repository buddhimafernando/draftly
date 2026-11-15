import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { DocumentListItem } from "@/lib/documents/queries";

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(iso));

export function DocumentList({
  items,
  emptyText,
  showOwner = false,
}: {
  items: DocumentListItem[];
  emptyText: string;
  showOwner?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-md border">
      {items.map((d) => (
        <li key={d.id}>
          <Link
            href={`/documents/${d.id}`}
            className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{d.title}</p>
              <p className="text-sm text-muted-foreground">
                {showOwner ? `Shared by ${d.ownerName} · ` : ""}
                Updated {formatDate(d.updatedAt)}
              </p>
            </div>
            <Badge variant={d.role === "owner" ? "default" : "secondary"}>
              {d.role === "owner" ? "Owner" : d.role === "editor" ? "Can edit" : "View only"}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}