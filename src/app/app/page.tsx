import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveMemberAppDestination } from "@/features/access/queries";

export default async function AppStartPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?redirect=/app");
  }

  const destination = await resolveMemberAppDestination(user.id);

  redirect(destination);
}
