import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";

type PageProps = {
  searchParams: Promise<{ org?: string }>;
};

export default async function AdminNewTicketPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { org } = await searchParams;
  const qs = new URLSearchParams({ create: "1" });
  if (org?.trim()) qs.set("org", org.trim());
  redirect(`/admin/tickets?${qs.toString()}`);
}
