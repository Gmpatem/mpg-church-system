import Link from "next/link";
import { redirect } from "next/navigation";
import { Church } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginDestination } from "@/features/auth/queries";
import { LoginForm } from "./LoginForm";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

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
    <div className="flex min-h-screen flex-col">
      {/* Subtle header with logo */}
      <header className="border-b border-slate-200 bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950">
              <Church className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">MPG Church</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center relative">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50" />
        
        <div className="relative w-full max-w-md px-4 py-12">
          {/* Login Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 mb-4">
                <Church className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Sign in to your church workspace
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Enter your email and password to continue
              </p>
            </div>

            {/* Registration success banner */}
            {registered && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium">Registration successful</p>
                    {checkEmail && (
                      <p className="mt-1 text-emerald-700">
                        Check your email before signing in if confirmation is required.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <LoginForm />

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-400">or</span>
              </div>
            </div>

            {/* Register link */}
            <div className="text-center">
              <p className="text-sm text-slate-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-cyan-700 hover:text-cyan-800 transition-colors"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>

          {/* Trust note */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Secure sign-in powered by industry-standard encryption
          </p>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
