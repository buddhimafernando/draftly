import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.TEST_USER_PASSWORD;
const configured = Boolean(url && key && password);

async function signIn(email: string) {
  const client = createClient<Database>(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password: password! });
  if (error || !data.user) throw new Error(`Sign-in failed for ${email}: ${error?.message}`);
  return { client, userId: data.user.id };
}

describe.skipIf(!configured)("document access control (RLS)", () => {
  let alice: Awaited<ReturnType<typeof signIn>>;
  let bob: Awaited<ReturnType<typeof signIn>>;
  let carol: Awaited<ReturnType<typeof signIn>>;
  let docId: string;

  beforeAll(async () => {
    [alice, bob, carol] = await Promise.all([
      signIn("alice.draftly@test.com"),
      signIn("bob.draftly@test.com"),
      signIn("carol.draftly@test.com"),
    ]);
    const { data, error } = await alice.client
      .from("documents")
      .insert({ owner_id: alice.userId, title: "RLS test document" })
      .select("id")
      .single();
    if (error || !data) throw new Error(`Could not create test document: ${error?.message}`);
    docId = data.id;
  });

  afterAll(async () => {
    if (docId) await alice.client.from("documents").delete().eq("id", docId);
  });

  it("hides an unshared document from other users", async () => {
    const { data } = await carol.client.from("documents").select("id").eq("id", docId);
    expect(data).toEqual([]);
  });

  it("stops a stranger from editing or deleting it", async () => {
    const update = await carol.client
      .from("documents")
      .update({ title: "hacked" })
      .eq("id", docId)
      .select("id");
    expect(update.data ?? []).toHaveLength(0);

    const del = await carol.client.from("documents").delete().eq("id", docId).select("id");
    expect(del.data ?? []).toHaveLength(0);
  });

  it("lets the owner share by email, and only the owner", async () => {
    const stranger = await carol.client.rpc("share_document", {
      p_document_id: docId,
      p_email: "carol.draftly@test.com",
      p_role: "editor",
    });
    expect(stranger.error?.code).toBe("42501");

    const owner = await alice.client.rpc("share_document", {
      p_document_id: docId,
      p_email: "bob.draftly@test.com",
      p_role: "viewer",
    });
    expect(owner.error).toBeNull();
  });

  it("gives a viewer read access but not write access", async () => {
    const read = await bob.client.from("documents").select("id").eq("id", docId);
    expect(read.data).toHaveLength(1);

    const write = await bob.client
      .from("documents")
      .update({ title: "viewer edit" })
      .eq("id", docId)
      .select("id");
    expect(write.data ?? []).toHaveLength(0);
  });

  it("lets an editor edit, but never change ownership, share or delete", async () => {
    const upgrade = await alice.client.rpc("share_document", {
      p_document_id: docId,
      p_email: "bob.draftly@test.com",
      p_role: "editor",
    });
    expect(upgrade.error).toBeNull();

    const edit = await bob.client
      .from("documents")
      .update({ title: "editor edit" })
      .eq("id", docId)
      .select("id");
    expect(edit.data).toHaveLength(1);

    const steal = await bob.client
      .from("documents")
      .update({ owner_id: bob.userId })
      .eq("id", docId);
    expect(steal.error).not.toBeNull();

    const share = await bob.client.rpc("share_document", {
      p_document_id: docId,
      p_email: "carol.draftly@test.com",
      p_role: "viewer",
    });
    expect(share.error?.code).toBe("42501");

    const del = await bob.client.from("documents").delete().eq("id", docId).select("id");
    expect(del.data ?? []).toHaveLength(0);
  });
});