import Link from "next/link";
import { SystemklarLogo } from "@/components/SystemklarLogo";
import { MARKETING_CONTACT_EMAIL } from "@/lib/marketing-contact";

const FOOTER_LINKS = [
  { href: "/funktioner", label: "Funktioner" },
  { href: "/priser", label: "Priser" },
  { href: "/om-os", label: "Om os" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/login", label: "Log ind" },
  { href: "/privatlivspolitik", label: "Privatlivspolitik" },
  { href: "/vilkaar", label: "Vilkår" },
] as const;

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1E3448] text-sm">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <SystemklarLogo href="/" variant="dark" size="md" />
            <p className="mt-4 leading-relaxed text-[#7A9AB0]">
              IT-overvågning og support til danske SMV&apos;er — uden en IT-afdeling.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {FOOTER_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[#7A9AB0] transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="mt-12 border-t border-white/10 pt-8 text-[#7A9AB0]">
          © {year} systemklar · CVR 46431596 ·{" "}
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
