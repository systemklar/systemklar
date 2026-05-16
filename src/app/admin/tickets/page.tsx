import { requireAdmin } from "@/lib/require-admin";
import AdminTicketsClient from "./tickets-client";

type PageProps = {
  searchParams: Promise<{ org?: string; create?: string }>;
};

export default async function AdminTicketsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { org, create } = await searchParams;
  return (
    <AdminTicketsClient
      initialOrganisationId={org?.trim() || undefined}
      initialOpenCreate={create === "1"}
    />
  );
}
