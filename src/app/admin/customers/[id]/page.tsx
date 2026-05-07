import { requireAdmin } from "@/lib/require-admin";
import AdminCustomerDetailClient from "./customer-detail-client";

export default async function AdminCustomerDetailPage() {
  await requireAdmin();
  return <AdminCustomerDetailClient />;
}
