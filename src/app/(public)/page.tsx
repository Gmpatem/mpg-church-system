import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingPageClient from "./components/LandingPageClient";

/**
 * Landing page server wrapper.
 *
 * Redirects authenticated users to /dashboard so they don't
 * see the marketing page when already logged in.
 */
export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPageClient />;
}
