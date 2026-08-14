import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const READ_REQUEST_RETRY_DELAY_MS = 150;

async function fetchWithReadRetry(input: RequestInfo | URL, init?: RequestInit) {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();

  try {
    return await fetch(input, init);
  } catch (error) {
    const isRetryableRead = method === "GET" || method === "HEAD";
    const isTransportFailure = error instanceof TypeError && error.message.toLowerCase().includes("fetch failed");

    if (!isRetryableRead || !isTransportFailure) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, READ_REQUEST_RETRY_DELAY_MS));
    return fetch(input, init);
  }
}

export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createServerClient(url, anonKey, {
    global: {
      fetch: fetchWithReadRetry,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }: {
              name: string;
              value: string;
              options: CookieOptions;
            }) => {
              cookieStore.set(name, value, options);
            }
          );
        } catch {
          // In some Server Component contexts, setting cookies is not allowed.
          // Middleware should handle refresh/session propagation in those cases.
        }
      },
    },
  });
}
