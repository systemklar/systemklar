import { requireAdmin } from "@/lib/require-admin";
import AdminSystemsClient from "./systemer-client";

export default async function AdminSystemerPage() {
  await requireAdmin();
  return <AdminSystemsClient />;
}
