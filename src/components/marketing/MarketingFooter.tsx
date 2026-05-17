import Link from "next/link";
import { SystemklarLogo } from "@/components/SystemklarLogo";
import { MARKETING_CONTACT_EMAIL } from "@/lib/marketing-contact";

const MAIN_LINKS = [
  { href: "/#it-support", label: "Support" },
  { href: "/#overblik", label: "Overblik" },
  { href: "/priser", label: "Priser" },
  { href: "/om-os", label: "Om os" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/login", label: "Log ind" },
] as const;

const LEGAL_LINKS = [
  { href: "/privatlivspolitik", label: "Privatlivspolitik" },
  { href: "/vilkaar", label: "Vilkår" },
] as const;

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0A1628] text-sm">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <SystemklarLogo href="/" variant="dark" size="md" />
            <p className="mt-4 leading-relaxed text-[#6A82A8]">
              IT-support og live overblik til danske virksomheder — uden en IT-afdeling.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-6 sm:flex-row sm:gap-12">
            <ul className="flex flex-col gap-3">
              {MAIN_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[#6A82A8] transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="flex flex-col gap-3">
              {LEGAL_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[#6A82A8] transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="text-[#6A82A8]">CVR 46431596</li>
            </ul>
          </nav>
        </div>
        <p className="mt-12 border-t border-white/10 pt-8 text-[#6A82A8]">
          © {year} systemklar ·{" "}
          <a
            href={`mailto:${MARKETING_CONTACT_EMAIL}`}
            className="transition-colors hover:text-white"
          >
            {MARKETING_CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </footer>
  );
}
