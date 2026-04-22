import { createClient } from "@/supabase/client";

export async function signInAdmin(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOutAdmin() {
  const supabase = createClient();
  return supabase.auth.signOut();
}
