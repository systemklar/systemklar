export type PortalOnboardingTourStep = {
  target: string;
  title: string;
  text: string;
};

export const PORTAL_ONBOARDING_TOUR_STEPS: PortalOnboardingTourStep[] = [
  {
    target: '[data-tour="dashboard-systemstatus"]',
    title: "Dit IT-overblik",
    text: "Her ser du altid status på dine systemer. Grøn betyder alt fungerer — gul eller rød betyder vi er på sagen.",
  },
  {
    target: '[data-tour="dashboard-system-tabs"]',
    title: "Dine IT-systemer",
    text: "Vi overvåger automatisk din hjemmeside, SSL-certifikat og email-sikkerhed. Du kan tilføje flere systemer under 'Systemer'.",
  },
  {
    target: '[data-tour="dashboard-active-tickets"]',
    title: "Support & sager",
    text: "Har du et IT-problem? Opret en sag og vi hjælper dig inden for 1 hverdag. Du kan følge status her.",
  },
  {
    target: '[data-tour="dashboard-latest-report"]',
    title: "Din månedlige IT-rapport",
    text: "Hver måned genererer vi en rapport over din IT-sundhed — klar til at downloade eller dele med din bestyrelse.",
  },
  {
    target: '[data-tour="portal-sidebar"]',
    title: "Navigation",
    text: "Find alt her til venstre — systemer, support, rapporter og dine indstillinger under Profil og Team.",
  },
];

export const PORTAL_TOUR_OPEN_SIDEBAR_EVENT = "portal-onboarding-tour-open-sidebar";
