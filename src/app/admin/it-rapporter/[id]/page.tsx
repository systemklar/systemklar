import { requireAdmin } from "@/lib/require-admin";
import ItReportDetailClient from "./it-report-detail-client";

export default async function AdminItReportDetailPage() {
  await requireAdmin();
  return <ItReportDetailClient />;
}
