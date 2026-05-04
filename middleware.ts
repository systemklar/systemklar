import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Admin-ruter må aldrig omdirigeres til kundeportalen herfra.
 * Auth + `admins`-tjek for /admin sker i `src/app/admin/layout.tsx` (useAdminAccess).
 *
 * Hvis du senere tilføjer fx. "logget ind → /portal" for `/`, så skal du
 * eksplicit undtage `pathname.startsWith("/admin")`.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
