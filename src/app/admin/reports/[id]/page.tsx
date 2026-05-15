import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";

/** Legacy rapport-URL; nye rapporter findes under /admin/it-rapporter/[id]. */
export default async function AdminReportDetailLegacyRedirect() {
  await requireAdmin();
  redirect("/admin/it-rapporter");
}
