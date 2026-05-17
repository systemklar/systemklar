"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Consent = "accepted" | "declined";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("cookie_consent");
    if (saved === "accepted" || saved === "declined") return;
    setVisible(true);
  }, []);

  const setConsent = (value: Consent) => {
    window.localStorage.setItem("cookie_consent", value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A1628] text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-4">
        <p className="text-sm text-[#E8EEFC]">
          Vi bruger cookies for at forbedre din oplevelse og huske dine præferencer. Læs mere i vores{" "}
          <Link href="/cookiepolitik" className="text-[#6A92D8] hover:underline">
            cookiepolitik
          </Link>
          .
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setConsent("declined")}
            className="rounded-full border border-white/30 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            Afvis
          </button>
          <button
            type="button"
            onClick={() => setConsent("accepted")}
            className="rounded-full bg-[#2952A3] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2952A3]"
          >
            Accepter alle
          </button>
        </div>
      </div>
    </div>
  );
}
