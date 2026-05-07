import { requireAdmin } from "@/lib/require-admin";
import AdminReportsClient from "./reports-client";

export default async function AdminReportsPage() {
  await requireAdmin();
  return <AdminReportsClient />;
}
