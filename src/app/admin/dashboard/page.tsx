import { requireAdmin } from "@/lib/require-admin";
import AdminDashboardClient from "./dashboard-client";

export default async function AdminDashboardPage() {
  await requireAdmin();
  return <AdminDashboardClient />;
}
