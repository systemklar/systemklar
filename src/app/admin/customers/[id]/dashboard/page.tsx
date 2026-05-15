import { requireAdmin } from "@/lib/require-admin";
import AdminCustomerPortalDashboardPreview from "./dashboard-preview-client";

export default async function AdminCustomerPortalDashboardPage() {
  await requireAdmin();
  return <AdminCustomerPortalDashboardPreview />;
}
