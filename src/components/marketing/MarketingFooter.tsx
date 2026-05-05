import Link from "next/link";
import { MARKETING_CONTACT_EMAIL, MARKETING_CONTACT_PHONE_DISPLAY, MARKETING_CONTACT_PHONE_TEL } from "@/lib/marketing-contact";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-900 bg-[#0A0A0A] text-sm text-gray-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="text-lg font-bold text-white">Systemklar</p>
          <p className="mt-3 leading-relaxed">
            Dansk IT-platform til drift, support og AI — bygget til virksomheder uden stor IT-afdeling.
          </p>
        </div>
        <div>
          <p className="font-semibold text-white">Produkt</p>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="/platformen" className="transition-colors hover:text-white">
                Platformen
              </Link>
            </li>
            <li>
              <Link href="/ai-vaerktoejer" className="transition-colors hover:text-white">
                AI-værktøjer
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
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="/book-demo" className="transition-colors hover:text-white">
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
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Support</p>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="/platformen" className="transition-colors hover:text-white">
                Dokumentation
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Kontakt os</p>
          <ul className="mt-4 space-y-3">
            <li>
              <a href={`mailto:${MARKETING_CONTACT_EMAIL}`} className="flex items-start gap-2 transition-colors hover:text-white">
                <span aria-hidden>📧</span>
                <span>{MARKETING_CONTACT_EMAIL}</span>
              </a>
            </li>
            <li>
              <a href={`tel:${MARKETING_CONTACT_PHONE_TEL}`} className="flex items-start gap-2 transition-colors hover:text-white">
                <span aria-hidden>📞</span>
                <span>{MARKETING_CONTACT_PHONE_DISPLAY}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <p className="mx-auto max-w-6xl px-6 py-6 text-gray-500">
          © {year} Systemklar. Alle rettigheder forbeholdes. CVR 46431596
        </p>
      </div>
    </footer>
  );
}
