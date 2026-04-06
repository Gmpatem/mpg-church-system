import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginDestination } from "@/features/auth/queries";

/**
 * Dashboard redirect page - resolves the appropriate destination for authenticated users.
 * 
 * Routing logic:
 * 1. Not authenticated → /login
 * 2. Platform admin (owner/admin/support) → /platform
 * 3. Has church membership → /c/[churchSlug]
 * 4. No churches → /create-church
 * 
 * This page should never redirect to itself - all destinations are stable endpoints.
 */
export default async function DashboardRedirectPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Case 1: Not authenticated
  if (error || !user) {
    redirect("/login");
  }

  // Resolve destination based on user's access state
  const destination = await getPostLoginDestination(user.id);
  
  // Safety check: never redirect back to /dashboard (would cause a loop)
  if (destination === "/dashboard" || destination.startsWith("/dashboard?")) {
    redirect("/create-church");
  }

  redirect(destination);
}
