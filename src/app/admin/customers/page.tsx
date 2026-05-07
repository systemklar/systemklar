import { requireAdmin } from "@/lib/require-admin";
import AdminCustomersClient from "./customers-client";

export default async function AdminCustomersPage() {
  await requireAdmin();
  return <AdminCustomersClient />;
}
