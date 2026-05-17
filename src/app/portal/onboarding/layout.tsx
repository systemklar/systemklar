/**
 * Onboarding uden PortalLayout — ingen sidebar, ingen portal-navigation.
 */
export default function PortalOnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh bg-[#F5F0E8] text-[#2C3020] surface-cards antialiased">{children}</div>
  );
}
