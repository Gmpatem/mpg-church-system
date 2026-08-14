import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function isStaticAsset(pathname: string) {
  return (
    pathname.includes(".") &&
    !pathname.endsWith(".well-known")
  );
}

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  const departmentId = request.nextUrl.searchParams.get("department") ?? "";
  requestHeaders.set("x-mpg-pathname", pathname);
  requestHeaders.set(
    "x-mpg-department-id",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(departmentId)
      ? departmentId
      : ""
  );
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    isStaticAsset(pathname)
  ) {
    return response;
  }

  const publicPrefixes = [
    "/",
    "/invite",
    "/join",
    "/login",
    "/register",
  ];

  const authOnlyPrefixes = [
    "/login",
    "/register",
  ];

  const protectedPrefixes = [
    "/dashboard",
    "/platform",
    "/c",
    "/my",
    "/create-church",
  ];

  const isPublicRoute = startsWithAny(pathname, publicPrefixes);
  const isAuthOnlyRoute = startsWithAny(pathname, authOnlyPrefixes);
  const isProtectedRoute = startsWithAny(pathname, protectedPrefixes);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthenticated = Boolean(session?.user);

  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";

    const intended =
      pathname + (request.nextUrl.search ? request.nextUrl.search : "");

    loginUrl.searchParams.set("redirect", intended);

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthOnlyRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  if (isPublicRoute || isProtectedRoute) {
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

