export function onboardingFirstName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return "der";
  return trimmed.split(/\s+/)[0] ?? "der";
}

export function needsOnboarding(onboardingCompleted: boolean | null | undefined): boolean {
  return onboardingCompleted !== true;
}
