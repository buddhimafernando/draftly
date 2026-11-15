"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mode = formData.get("mode") === "signup" ? "signup" : "signin";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (!password) return { error: "Enter your password." };

  const supabase = await createClient();

  if (mode === "signin") {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "Invalid email or password." };
    redirect("/documents");
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (name.length > 80) return { error: "Name must be 80 characters or fewer." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  });
  if (error) return { error: error.message };
  if (!data.session) {
    return { error: "Account created. Confirm your email, then sign in." };
  }
  redirect("/documents");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}