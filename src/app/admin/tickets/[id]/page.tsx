import { requireAdmin } from "@/lib/require-admin";
import AdminTicketDetailClient from "./ticket-detail-client";

export default async function AdminTicketDetailPage() {
  await requireAdmin();
  return <AdminTicketDetailClient />;
}
