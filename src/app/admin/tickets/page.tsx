import { requireAdmin } from "@/lib/require-admin";
import AdminTicketsClient from "./tickets-client";

export default async function AdminTicketsPage() {
  await requireAdmin();
  return <AdminTicketsClient />;
}
