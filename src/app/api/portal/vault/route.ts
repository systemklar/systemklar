import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  encryptVaultPassword,
  isVaultCategory,
  mapVaultRowToResponse,
  type VaultEntryRow,
} from "@/lib/vault-crypto";

async function getAuthedClient() {
  const cookieStore = await cookies();
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* ignore */
          }
        },
      },
    },
  );
  const {
    data: { user },
  } = await client.auth.getUser();
  return { client, user };
}

export async function GET() {
  const { client, user } = await getAuthedClient();
  if (!user) {
    return NextResponse.json({ error: "Ikke logget ind." }, { status: 401 });
  }

  const { data, error } = await client
    .from("vault_entries")
    .select("id,user_id,name,username,encrypted_password,url,category,notes,created_at,updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    const entries = ((data ?? []) as VaultEntryRow[]).map(mapVaultRowToResponse);
    return NextResponse.json({ entries });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Dekryptering fejlede.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { client, user } = await getAuthedClient();
  if (!user) {
    return NextResponse.json({ error: "Ikke logget ind." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const name =
    typeof body === "object" && body !== null && "name" in body && typeof body.name === "string"
      ? body.name.trim()
      : "";
  const username =
    typeof body === "object" && body !== null && "username" in body && typeof body.username === "string"
      ? body.username.trim() || null
      : null;
  const password =
    typeof body === "object" && body !== null && "password" in body && typeof body.password === "string"
      ? body.password
      : "";
  const url =
    typeof body === "object" && body !== null && "url" in body && typeof body.url === "string"
      ? body.url.trim() || null
      : null;
  const notes =
    typeof body === "object" && body !== null && "notes" in body && typeof body.notes === "string"
      ? body.notes.trim() || null
      : null;
  const categoryRaw = typeof body === "object" && body !== null && "category" in body ? body.category : null;
  const category = isVaultCategory(categoryRaw) ? categoryRaw : null;

  if (!name) {
    return NextResponse.json({ error: "Navn er påkrævet." }, { status: 400 });
  }

  let encryptedPassword: string | null = null;
  if (password.trim()) {
    try {
      encryptedPassword = encryptVaultPassword(password);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Kryptering fejlede.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const { data, error } = await client
    .from("vault_entries")
    .insert({
      user_id: user.id,
      name,
      username,
      encrypted_password: encryptedPassword,
      url,
      category,
      notes,
    })
    .select("id,user_id,name,username,encrypted_password,url,category,notes,created_at,updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Kunne ikke oprette entry." }, { status: 400 });
  }

  const entry = mapVaultRowToResponse(data as VaultEntryRow);
  return NextResponse.json({ entry }, { status: 201 });
}
