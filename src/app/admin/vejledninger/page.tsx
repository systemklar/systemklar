import { requireAdmin } from "@/lib/require-admin";
import AdminVejledningerClient from "./vejledninger-client";

export default async function AdminVejledningerPage() {
  await requireAdmin();
  return <AdminVejledningerClient />;
}
