/**
 * Denne layout gælder kun for URL'er under `/portal`.
 * Den påvirker ikke `/admin` (admin har egen route-træ og adgangstjek).
 */
export default function PortalRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
