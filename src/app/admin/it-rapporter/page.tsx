import { requireAdmin } from "@/lib/require-admin";
import AdminItRapporterClient from "./it-rapporter-client";

type PageProps = {
  searchParams: Promise<{ org?: string }>;
};

export default async function AdminItRapporterPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { org } = await searchParams;
  return <AdminItRapporterClient initialOrganisationId={org?.trim() || undefined} />;
}
