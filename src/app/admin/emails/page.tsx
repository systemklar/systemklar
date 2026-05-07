import { requireAdmin } from "@/lib/require-admin";
import AdminEmailsClient from "./emails-client";

export default async function AdminEmailsPage() {
  await requireAdmin();
  return <AdminEmailsClient />;
}
