import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SYSTEM_PROMPT =
  "Du er en professionel tilbudsassistent for en dansk SMV. Generer et skarpt, professionelt tilbud på dansk baseret på valgte tjenester og kundens behov.";

const MODEL = "claude-sonnet-4-5";

function extractAnthropicText(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const content = (body as { content?: unknown }).content;
  if (!Array.isArray(content)) return null;
  for (const block of content) {
    if (
      block &&
      typeof block === "object" &&
      (block as { type?: string }).type === "text" &&
      typeof (block as { text?: string }).text === "string"
    ) {
      return (block as { text: string }).text;
    }
  }
  return null;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /* ignore */
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const serviceIds =
    typeof body === "object" && body !== null && "serviceIds" in body
      ? (body as { serviceIds: unknown }).serviceIds
      : null;
  const needsDescription =
    typeof body === "object" && body !== null && "needsDescription" in body
      ? (body as { needsDescription: unknown }).needsDescription
      : "";

  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    return NextResponse.json({ error: "Vælg mindst én tjeneste." }, { status: 400 });
  }

  const ids = serviceIds.filter((id): id is string => typeof id === "string" && UUID_RE.test(id));
  if (ids.length === 0) {
    return NextResponse.json({ error: "Ugyldige tjeneste-id'er." }, { status: 400 });
  }

  const needs = typeof needsDescription === "string" ? needsDescription.trim() : "";

  const { data: services, error: sErr } = await supabaseAuth
    .from("services")
    .select("id, name, description, price, unit")
    .eq("user_id", user.id)
    .in("id", ids);

  if (sErr) {
    console.error("[api/portal/quotes/generate] services", sErr);
    return NextResponse.json({ error: sErr.message }, { status: 400 });
  }

  if (!services?.length) {
    return NextResponse.json({ error: "Ingen gyldige tjenester." }, { status: 400 });
  }

  const formatPrice = (n: string | number) => {
    const num = typeof n === "string" ? parseFloat(n) : n;
    return Number.isFinite(num)
      ? new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK" }).format(num)
      : String(n);
  };

  const unitLabel = (u: string) => {
    if (u === "månedlig") return "pr. måned";
    if (u === "time") return "pr. time";
    if (u === "engangspris") return "engang";
    return u;
  };

  const lines = (services as { name: string; description: string | null; price: unknown; unit: string }[]).map(
    (s) => {
      const desc = s.description?.trim() ? ` — ${s.description.trim()}` : "";
      return `- ${s.name}${desc}: ${formatPrice(s.price as string | number)} (${unitLabel(s.unit)})`;
    },
  );

  const userMessage = `Generér et tilbud til min kunde.

Valgte ydelser og priser:
${lines.join("\n")}

Kundens behov:
${needs || "(Ikke angivet — ud fra ydelserne alene.)"}

Formatér tilbuddet med tydelige sektioner, professionel tone, konkrete leverancer, priser og næste skridt.`;

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY er ikke sat." }, { status: 500 });
  }

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  const anthropicJson: unknown = await anthropicRes.json().catch(() => null);

  if (!anthropicRes.ok) {
    const errMsg =
      anthropicJson && typeof anthropicJson === "object" && "error" in anthropicJson
        ? JSON.stringify((anthropicJson as { error: unknown }).error)
        : anthropicRes.statusText;
    console.error("[api/portal/quotes/generate] anthropic", anthropicRes.status, errMsg);
    return NextResponse.json({ error: `AI-kald fejlede: ${errMsg}` }, { status: 502 });
  }

  const text = extractAnthropicText(anthropicJson);
  if (!text?.trim()) {
    return NextResponse.json({ error: "AI returnerede intet indhold." }, { status: 502 });
  }

  const suggestedTitle = `Tilbud — ${new Intl.DateTimeFormat("da-DK", {
    dateStyle: "medium",
  }).format(new Date())}`;

  return NextResponse.json({
    content: text.trim(),
    suggestedTitle,
  });
}
