import { requireAdmin } from "@/lib/require-admin";
import AdminDashboardClient from "../dashboard/dashboard-client";

export default async function AdminOverblikPage() {
  await requireAdmin();
  return <AdminDashboardClient />;
}
