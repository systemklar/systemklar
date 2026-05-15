import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";

/** Legacy route: per-kunde IT-rapporter ligger nu under /admin/it-rapporter. */
export default async function AdminReportsLegacyRedirect() {
  await requireAdmin();
  redirect("/admin/it-rapporter");
}
