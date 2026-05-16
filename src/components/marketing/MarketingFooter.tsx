import Link from "next/link";
import { SystemklarLogo } from "@/components/branding/SystemklarLogo";
import { MARKETING_CONTACT_EMAIL, MARKETING_CONTACT_PHONE_DISPLAY, MARKETING_CONTACT_PHONE_TEL } from "@/lib/marketing-contact";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t-2 border-sky-800/80 bg-[#041f33] text-sm text-sky-100">
      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 md:grid-cols-2 md:gap-12 md:py-24 lg:grid-cols-4">
        <div className="md:col-span-2 lg:col-span-1">
          <SystemklarLogo href="/" variant="dark" textClassName="text-base font-bold tracking-tight" />
          <p className="mt-4 leading-relaxed text-sky-200">
            IT-platform til danske SMV&apos;er – uden en IT-afdeling.
          </p>
        </div>
        <div>
          <p className="font-semibold text-white">Produkt</p>
          <ul className="mt-5 space-y-3">
            <li>
              <Link href="/platformen" className="transition-colors hover:text-white">
                Platformen
              </Link>
            </li>
            <li>
              <Link href="/ai-vaerktoejer" className="transition-colors hover:text-white">
                Funktioner
              </Link>
            </li>
            <li>
              <Link href="/priser" className="transition-colors hover:text-white">
                Priser
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Virksomhed</p>
          <ul className="mt-5 space-y-3">
            <li>
              <Link href="/om-os" className="transition-colors hover:text-white">
                Om os
              </Link>
            </li>
            <li>
              <Link href="/kontakt" className="transition-colors hover:text-white">
                Book demo
              </Link>
            </li>
            <li>
              <Link href="/login" className="transition-colors hover:text-white">
                Log ind
              </Link>
            </li>
            <li>
              <Link href="/kontakt" className="transition-colors hover:text-white">
                Kontakt
              </Link>
            </li>
            <li>
              <Link href="/privatlivspolitik" className="text-[#7AAEC8] text-sm transition-colors hover:text-white">
                Privatlivspolitik
              </Link>
            </li>
            <li>
              <Link href="/cookiepolitik" className="text-[#7AAEC8] text-sm transition-colors hover:text-white">
                Cookiepolitik
              </Link>
            </li>
            <li>
              <Link href="/vilkaar" className="text-[#7AAEC8] text-sm transition-colors hover:text-white">
                Vilkår
              </Link>
            </li>
            <li>
              <Link href="/databehandleraftale" className="text-[#7AAEC8] text-sm transition-colors hover:text-white">
                Databehandleraftale
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Kontakt</p>
          <ul className="mt-5 space-y-3">
            <li>
              <a href={`mailto:${MARKETING_CONTACT_EMAIL}`} className="transition-colors hover:text-white">
                {MARKETING_CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <a href={`tel:${MARKETING_CONTACT_PHONE_TEL}`} className="transition-colors hover:text-white">
                {MARKETING_CONTACT_PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <span>CVR 46431596</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sky-900/60">
        <p className="mx-auto max-w-5xl px-6 py-6 text-sky-300">
          © {year} systemklar. Alle rettigheder forbeholdes.
        </p>
      </div>
    </footer>
  );
}
