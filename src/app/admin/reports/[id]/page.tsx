import { requireAdmin } from "@/lib/require-admin";
import AdminReportDetailClient from "./report-detail-client";

export default async function AdminReportDetailPage() {
  await requireAdmin();
  return <AdminReportDetailClient />;
}
