import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

/**
 * Server-side hjælper der kræver at den indloggede bruger findes i
 * `public.admins`. Bruges fra admin-pages (server components / RSC) og
 * redirecter til `/admin/login` hvis betingelserne ikke er opfyldt.
 *
 * Bemærk: opslaget i `admins` sker via service-role-klienten så det ikke
 * afhænger af RLS-policies på tabellen. SUPABASE_SERVICE_ROLE_KEY må aldrig
 * eksponeres til klienten — denne fil må kun importeres fra server-kode.
 */
export async function requireAdmin(): Promise<{ user: User }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const service = createServiceRoleClient();
  if (!service) {
    console.error("[requireAdmin] SUPABASE_SERVICE_ROLE_KEY mangler");
    redirect("/admin/login");
  }

  const { data: adminRow, error } = await service
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[requireAdmin] admins lookup failed", error);
    redirect("/admin/login");
  }

  if (!adminRow) {
    redirect("/admin/login");
  }

  return { user };
}
