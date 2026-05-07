import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });
  const pathname = request.nextUrl.pathname;

  if (
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/set-password" ||
    pathname === "/forgot-password" ||
    pathname === "/set-password" ||
    pathname === "/login"
  ) {
    return response;
  }

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

  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  /** Alle stier under /portal (fx /portal/tilbudsgenerator) kræver login. */
  const isPortalArea = pathname.startsWith("/portal");

  if (isAdminArea) {
    if (!user) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(login);
    }

    /** Tjek om user.id findes i admins-tabellen. Service-role omgår RLS så
     *  middleware ikke bliver afhængig af specifikke policies. */
    let isAdmin = false;
    const serviceClient = createServiceRoleClient();
    if (serviceClient) {
      const { data: adminRow } = await serviceClient
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      isAdmin = Boolean(adminRow);
    } else {
      /** Fallback: user-context klient (kræver RLS-policy der lader bruger se egen række). */
      const { data: adminRow } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      isAdmin = Boolean(adminRow);
    }

    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (isPortalArea) {
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(login);
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
