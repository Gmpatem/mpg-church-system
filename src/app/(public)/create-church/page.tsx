import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginDestination } from "@/features/auth/queries";
import { CreateChurchForm } from "./CreateChurchForm";

export default async function CreateChurchPage() {
  // Auth guard: require authentication to create a church
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?redirect=/create-church");
  }

  // If user already has a church membership, redirect them to their workspace
  const destination = await getPostLoginDestination(user.id);
  if (destination !== "/create-church") {
    redirect(destination);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Church</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create a new church workspace. You will become its church admin.
          </p>
        </div>

        <CreateChurchForm />

        <p className="mt-6 text-sm text-gray-600">
          <Link href="/dashboard" className="underline hover:text-gray-800">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
