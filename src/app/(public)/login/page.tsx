import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginDestination } from "@/features/auth/queries";
import { LoginForm } from "./LoginForm";

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Check if already logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const destination = await getPostLoginDestination(user.id);
    redirect(destination);
  }
  
  const params = (await searchParams) ?? {};
  const registered = params.registered === "1";
  const checkEmail = params.check_email === "1";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Login</h1>
          <p className="text-sm text-gray-600 mt-1">
            Sign in to access your church workspace.
          </p>
        </div>

        {registered && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Registration successful.
            {checkEmail ? " Check your email before signing in if confirmation is required." : ""}
          </div>
        )}

        <LoginForm />

        <p className="mt-6 text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:text-blue-800 underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
