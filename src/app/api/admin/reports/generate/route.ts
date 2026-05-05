import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

const MODEL = "claude-sonnet-4-20250514";
const SYSTEM_PROMPT =
  "Du er en IT-konsulent for Systemklar. Generer en professionel dansk IT-rapport baseret på følgende sager. Inkluder: statusoversigt, løste problemer, aktive problemer og anbefalinger.";

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

function tryParseReportSections(text: string): {
  status_summary: string;
  incidents: string;
  resolved: string;
  recommendations: string;
} | null {
  const trimmed = text.trim();
  const direct = (() => {
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      return null;
    }
  })();
  const fromCodeBlock = (() => {
    const match = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
    if (!match) return null;
    try {
      return JSON.parse(match[1]) as Record<string, unknown>;
    } catch {
      return null;
    }
  })();
  const parsed = direct ?? fromCodeBlock;
  if (!parsed) return null;
  return {
    status_summary: String(parsed.status_summary ?? "").trim(),
    incidents: String(parsed.incidents ?? "").trim(),
    resolved: String(parsed.resolved ?? "").trim(),
    recommendations: String(parsed.recommendations ?? "").trim(),
  };
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const userId =
    typeof body === "object" && body !== null && "user_id" in body
      ? String((body as { user_id?: unknown }).user_id ?? "")
      : "";
  if (!userId) {
    return NextResponse.json({ error: "user_id er påkrævet." }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("company_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 400 });
  }

  const { data: tickets, error: ticketsErr } = await admin
    .from("tickets")
    .select("title, status, description")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (ticketsErr) {
    return NextResponse.json({ error: ticketsErr.message }, { status: 400 });
  }

  const rows = (tickets ?? []) as { title: string; status: string; description: string | null }[];
  const activeCount = rows.filter((t) => t.status === "active").length;
  const resolvedCount = rows.filter((t) => t.status === "resolved").length;

  const companyName = String((profile as { company_name?: string } | null)?.company_name ?? "Kunde");
  const ticketLines = rows.length
    ? rows
        .map(
          (t, i) =>
            `${i + 1}. Titel: ${t.title}\n   Status: ${t.status}\n   Beskrivelse: ${t.description?.trim() || "(ingen beskrivelse)"}`,
        )
        .join("\n")
    : "Ingen sager registreret i perioden.";

  const userMessage = `Kunde: ${companyName}
Aktive sager: ${activeCount}
Løste sager: ${resolvedCount}

Sager:
${ticketLines}

Returnér KUN gyldig JSON med præcis disse nøgler:
{
  "status_summary": "...",
  "incidents": "...",
  "resolved": "...",
  "recommendations": "..."
}`;

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
      max_tokens: 3000,
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
    return NextResponse.json({ error: `AI-kald fejlede: ${errMsg}` }, { status: 502 });
  }

  const text = extractAnthropicText(anthropicJson);
  if (!text?.trim()) {
    return NextResponse.json({ error: "AI returnerede intet indhold." }, { status: 502 });
  }
  const sections = tryParseReportSections(text);
  if (!sections) {
    return NextResponse.json({ error: "AI-svar kunne ikke parses som gyldig JSON." }, { status: 502 });
  }

  return NextResponse.json({
    sections,
    summary: { active: activeCount, resolved: resolvedCount },
  });
}
