import { redirect } from "next/navigation";
import { createClient } from "./server";

/** Returns the currently authenticated user, or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Guards a route: redirects to the login page when no user is signed in. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Ensures the current user is an admin (email present in the admins allowlist). */
export async function requireAdmin() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("admins")
    .select("email")
    .eq("email", (user.email ?? "").toLowerCase())
    .maybeSingle();
  if (!data) throw new Error("Keine Admin-Berechtigung.");
  return user;
}
