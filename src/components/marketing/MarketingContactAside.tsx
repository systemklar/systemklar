import { MARKETING_CONTACT_EMAIL, MARKETING_CONTACT_PHONE_DISPLAY, MARKETING_CONTACT_PHONE_TEL } from "@/lib/marketing-contact";

type Props = {
  className?: string;
  /** Kort variant til sidebar */
  concise?: boolean;
};

export function MarketingContactAside({ className = "", concise = false }: Props) {
  return (
    <aside
      className={`rounded-2xl border border-gray-100 bg-white p-8 shadow-sm ${className}`}
      aria-labelledby="marketing-contact-heading"
    >
      <h2 id="marketing-contact-heading" className={`font-semibold text-[#0A0A0A] ${concise ? "text-lg" : "text-xl"}`}>
        Kontakt os
      </h2>
      {!concise ? (
        <p className="mt-3 text-sm leading-relaxed text-[#6B6B6B]">
          Vi svarer typisk samme dag på hverdage. Ring eller skriv — vælg det der passer jer bedst.
        </p>
      ) : null}
      <ul className={`space-y-4 ${concise ? "mt-6" : "mt-6"}`}>
        <li>
          <span className="text-sm font-medium text-[#0A0A0A]">Email</span>
          <br />
          <a
            href={`mailto:${MARKETING_CONTACT_EMAIL}`}
            className="mt-1 inline-flex items-center gap-2 text-[#2563EB] hover:text-[#1D4ED8]"
          >
            {MARKETING_CONTACT_EMAIL}
          </a>
        </li>
        <li>
          <span className="text-sm font-medium text-[#0A0A0A]">Telefon</span>
          <br />
          <a
            href={`tel:${MARKETING_CONTACT_PHONE_TEL}`}
            className="mt-1 inline-flex items-center gap-2 text-[#2563EB] hover:text-[#1D4ED8]"
          >
            {MARKETING_CONTACT_PHONE_DISPLAY}
          </a>
        </li>
      </ul>
    </aside>
  );
}
