/**
 * Onboarding uden PortalLayout — ingen sidebar, ingen portal-navigation.
 */
export default function PortalOnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh bg-[#F7F4EF] text-[#1E3448] surface-cards antialiased">{children}</div>
  );
}
