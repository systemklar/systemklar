/**
 * Onboarding uden PortalLayout — ingen sidebar, ingen portal-navigation.
 */
export default function PortalOnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh bg-[#F5FAFD] text-[#0D1F2D] surface-cards antialiased">{children}</div>
  );
}
