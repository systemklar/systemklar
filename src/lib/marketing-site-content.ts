import type { LucideIcon } from "lucide-react";
import {
  Bell,
  FileText,
  Flag,
  MessageSquare,
  Monitor,
  Zap,
} from "lucide-react";

export type MarketingFeature = {
  icon: LucideIcon;
  title: string;
  teaser: string;
  description: string;
  checks: string[];
  frequency: string;
  customerSees: string;
};

export const MARKETING_FEATURES: MarketingFeature[] = [
  {
    icon: Monitor,
    title: "Automatisk overvågning",
    teaser: "Vi holder øje med jeres kritiske systemer døgnet rundt.",
    description:
      "Få et samlet overblik over hjemmeside, SSL, email og domæne — uden at logge ind hos fem forskellige leverandører.",
    checks: [
      "Hjemmeside og oppetid",
      "SSL-certifikat",
      "Email-sikkerhed (SPF, DKIM, DMARC)",
      "Domæne og WHOIS",
    ],
    frequency: "Kontinuerligt — typisk tjek hvert 5. minut",
    customerSees:
      "Et dashboard med status for hvert system, historik og en tydelig besked når alt fungerer.",
  },
  {
    icon: Bell,
    title: "Besked når noget fejler",
    teaser: "Email med det samme, så I kan handle før kunderne opdager det.",
    description:
      "Når et system går ned eller kræver opmærksomhed, får I besked med det samme — ikke først når nogen ringer.",
    checks: [
      "Email ved nedetid eller fejl",
      "Advarsler ved SSL der udløber",
      "DNS- og email-problemer",
    ],
    frequency: "Med det samme ved registreret fejl",
    customerSees:
      "En klar email med hvad der fejler, plus status i portalen med grøn, gul eller rød markering.",
  },
  {
    icon: FileText,
    title: "Månedlig IT-rapport",
    teaser: "Klar rapport til bestyrelse og ledelse — uden at samle data manuelt.",
    description:
      "Hver måned får I en struktureret rapport over jeres IT-sundhed, som I kan dele internt eller med revisorer.",
    checks: [
      "Overblik over alle overvågede systemer",
      "Status og hændelser i perioden",
      "Anbefalinger ved behov",
    ],
    frequency: "Udgives månedligt (ugentligt på Pro)",
    customerSees:
      "En PDF-klar rapport i portalen med perioden, status og download-knap — klar til bestyrelsesmødet.",
  },
  {
    icon: MessageSquare,
    title: "Support når I har brug",
    teaser: "Opret en sag og få svar fra et dansk team inden for 1 hverdag.",
    description:
      "Når noget kræver menneskelig hjælp, opretter I en support-sag direkte i platformen og følger dialogen ét sted.",
    checks: [
      "Sagsoprettelse med ticket-nummer",
      "Beskedtråd med jeres kontaktperson",
      "Status på åbne og lukkede sager",
    ],
    frequency: "Support svarer inden for 1 hverdag",
    customerSees:
      "En oversigt over alle sager med status, datoer og beskedhistorik — ligesom I kender det fra professionel helpdesk.",
  },
  {
    icon: Zap,
    title: "Enkel opsætning",
    teaser: "Kom i gang på under 10 minutter — vi guider jer hele vejen.",
    description:
      "Ingen teknisk viden krævet. Vi hjælper med at tilføje jeres systemer og starter overvågning, når I er klar.",
    checks: [
      "Guidet onboarding i portalen",
      "Tilføj systemer med få klik",
      "Hjælp til integrationer ved behov",
    ],
    frequency: "Engangsopsætning — typisk under 10 minutter",
    customerSees:
      "En trin-for-trin guide i portalen og en tydelig liste over, hvad der mangler opsætning.",
  },
  {
    icon: Flag,
    title: "Dansk support",
    teaser: "Et dansk team der forstår SMV'er — ikke et oversøisk callcenter.",
    description:
      "Vi er baseret i Danmark og taler jeres sprog. Support, rapporter og platformen er på dansk.",
    checks: [
      "Dansk supportteam",
      "Dansk platform og dokumentation",
      "CVR og dansk fakturering",
    ],
    frequency: "Hverdage — hurtig respons på sager",
    customerSees:
      "Kommunikation på dansk i hele platformen, fra emails til support-svar og rapporter.",
  },
];

export type PricingPlan = {
  name: string;
  price: string;
  description: string;
  highlight: boolean;
  features: string[];
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: "499 kr/md",
    description: "Til mindre virksomheder der vil have styr på det vigtigste.",
    highlight: false,
    features: ["Op til 3 systemer", "E-mail support", "Månedlig rapport"],
  },
  {
    name: "Pro",
    price: "999 kr/md",
    description: "Til virksomheder der vil have fuld overvågning og prioriteret hjælp.",
    highlight: true,
    features: [
      "Ubegrænsede systemer",
      "Prioriteret support",
      "Ugentlig rapport",
      "API-integrationer",
    ],
  },
];

export const PLAN_COMPARISON_ROWS: Array<{
  label: string;
  starter: string;
  pro: string;
}> = [
  { label: "Overvågede systemer", starter: "Op til 3", pro: "Ubegrænset" },
  { label: "Automatisk overvågning", starter: "Ja", pro: "Ja" },
  { label: "Email ved fejl", starter: "Ja", pro: "Ja" },
  { label: "IT-rapport", starter: "Månedlig", pro: "Ugentlig" },
  { label: "Support & sager", starter: "E-mail", pro: "Prioriteret" },
  { label: "Teammedlemmer i portalen", starter: "Op til 3", pro: "Ubegrænset" },
  { label: "API-integrationer", starter: "—", pro: "Ja" },
  { label: "Onboarding-hjælp", starter: "Ja", pro: "Ja" },
];

export const PRICING_BILLING_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "Er der binding eller opsigelsesgebyr?",
    answer:
      "Nej. I betaler måned for måned og kan opsige når som helst. Der er ingen skjulte gebyrer ved opsigelse.",
  },
  {
    question: "Hvornår træder opsigelse i kraft?",
    answer:
      "Opsigelse gælder fra udgangen af den betalte periode. I har adgang til platformen indtil da.",
  },
  {
    question: "Kan jeg skifte mellem Starter og Pro?",
    answer:
      "Ja. I kan opgradere eller nedgradere når som helst. Ændringer træder typisk i kraft med det samme.",
  },
  {
    question: "Er priserne inkl. eller ex. moms?",
    answer: "Alle priser er ex. moms. I modtager dansk faktura med moms som angivet på jeres CVR.",
  },
  {
    question: "Hvad sker der efter jeg tilmelder mig?",
    answer:
      "I får adgang til portalen med det samme. Vi guider jer gennem opsætning — de fleste er klar på under 10 minutter.",
  },
];
