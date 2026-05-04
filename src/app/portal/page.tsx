"use client";

import { PortalLayout, usePortalSession } from "@/components/portal/PortalLayout";

function DashboardContent() {
  const session = usePortalSession();

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-3xl font-bold">Velkommen til dashboardet</h1>
        <p className="mt-3 text-slate-600">
          Du er logget ind som{" "}
          <span className="font-semibold">{session?.email ?? "…"}</span>.
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">IT-overblik</h2>
          <p className="mt-2 text-sm text-slate-600">
            Placeholder: samlet status over systemer, enheder og drift.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Åbne sager</h2>
          <p className="mt-2 text-sm text-slate-600">
            Placeholder: aktive supportsager med status og prioritet.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Seneste rapport</h2>
          <p className="mt-2 text-sm text-slate-600">
            Placeholder: månedlig IT-rapport med nøgletal og anbefalinger.
          </p>
        </article>
      </div>
    </>
  );
}

export default function PortalPage() {
  return (
    <PortalLayout activeNav="dashboard">
      <DashboardContent />
    </PortalLayout>
  );
}
