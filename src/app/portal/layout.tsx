"use client";

import { usePathname } from "next/navigation";
import { PortalLayout, activeNavFromPortalPath } from "@/components/portal/PortalLayout";

/**
 * Ét vedvarende portal-skal (sidebar, session) for alle `/portal/*`-sider undtagen onboarding,
 * så klient-navigation ikke remounter layout og undgår "Indlæser portal..." mellem faner.
 */
export default function PortalRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/portal/onboarding")) {
    return <>{children}</>;
  }
  return <PortalLayout activeNav={activeNavFromPortalPath(pathname)}>{children}</PortalLayout>;
}
