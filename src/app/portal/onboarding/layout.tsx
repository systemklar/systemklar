/**
 * Onboarding uden PortalLayout — ingen sidebar, ingen portal-navigation.
 */
export default function PortalOnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh bg-[#F2F5FA] text-[#0A1628] surface-cards antialiased">{children}</div>
  );
}
