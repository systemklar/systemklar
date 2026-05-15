"use client";

import { PortalLayout } from "@/components/portal/PortalLayout";
import { PortalSystemsDashboard } from "@/components/portal/PortalSystemsDashboard";

export default function PortalPage() {
  return (
    <PortalLayout activeNav="dashboard">
      <PortalSystemsDashboard />
    </PortalLayout>
  );
}
