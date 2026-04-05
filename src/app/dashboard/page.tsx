import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginDestination } from "@/features/auth/queries";

export default async function DashboardRedirectPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const destination = await getPostLoginDestination(user.id);
  redirect(destination);
}
