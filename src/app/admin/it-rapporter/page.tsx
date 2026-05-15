import { requireAdmin } from "@/lib/require-admin";
import AdminItRapporterClient from "./it-rapporter-client";

export default async function AdminItRapporterPage() {
  await requireAdmin();
  return <AdminItRapporterClient />;
}
