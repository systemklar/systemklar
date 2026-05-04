import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function adminForbidden(): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html lang="da"><head><meta charset="utf-8"/><title>403</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:32rem"><h1>403 — Ingen adgang</h1><p>Du har ikke adgang til admin-området.</p><p><a href="/portal">Gå til kundeportalen</a> · <a href="/login">Log ud og log ind igen</a></p></body></html>`,
    { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isPortalArea = pathname.startsWith("/portal");

  let isAdmin = false;
  if (user) {
    const { data: adminRow, error } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[middleware] admins lookup", error.message);
    }
    isAdmin = !!adminRow;
  }

  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = isAdmin ? "/admin" : "/portal";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isAdminArea) {
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(login);
    }
    if (!isAdmin) {
      return adminForbidden();
    }
    return response;
  }

  if (isPortalArea) {
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(login);
    }
    if (isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
