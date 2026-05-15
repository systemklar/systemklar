"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectBody() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const subject = searchParams.get("subject")?.trim();
    const qs = subject ? `?${new URLSearchParams({ subject }).toString()}` : "";
    router.replace(`/portal/support${qs}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-[#F5FAFD] px-4">
      <p className="text-sm text-slate-600">Viderestiller til support…</p>
    </div>
  );
}

export default function PortalSupportNewRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-[#F5FAFD] px-4">
          <p className="text-sm text-slate-600">Indlæser…</p>
        </div>
      }
    >
      <RedirectBody />
    </Suspense>
  );
}
