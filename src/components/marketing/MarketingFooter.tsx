import Link from "next/link";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-900 bg-[#0A0A0A] text-sm text-gray-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
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
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Support</p>
          <ul className="mt-4 space-y-2">
            <li>
              <a href="mailto:kontakt@systemklar.dk" className="transition-colors hover:text-white">
                kontakt@systemklar.dk
              </a>
            </li>
            <li>
              <Link href="/platformen" className="transition-colors hover:text-white">
                Dokumentation
              </Link>
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
