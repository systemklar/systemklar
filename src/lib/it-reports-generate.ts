import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildMonitoringSectionFromRows,
  type ITReportContentV1,
} from "@/lib/it-reports";

const MODEL = "claude-sonnet-4-20250514";

type MonRow = { system_name: string; status: string; checked_at: string };

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

function tryParseItReportAi(text: string): { ai_summary: string; ai_recommendations: string } | null {
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
  const ai_summary = String(parsed.ai_summary ?? "").trim();
  const ai_recommendations = String(parsed.ai_recommendations ?? "").trim();
  if (!ai_summary) return null;
  return { ai_summary, ai_recommendations };
}

async function callAnthropicItReport(dataBlock: string): Promise<{ ai_summary: string; ai_recommendations: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY er ikke sat.");

  const system = `Du skriver på dansk til en ikke-teknisk virksomhedsejer som en betroet IT-rådgiver.
Returnér KUN gyldig JSON med præcis disse nøgler (ingen markdown udenfor JSON):
{
  "ai_summary": "ét afsnit på 3-5 sætninger",
  "ai_recommendations": "2-4 konkrete linjer, hver linje starter med tegnet - (tankestreg mellemrum)"
}
Brug konkrete tal og systemnavne fra datagrundlaget. Undgå jargon.`;

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system,
      messages: [
        {
          role: "user",
          content: `Her er data for den seneste måned (ca. 30 dage). Brug det til JSON-svaret:\n\n${dataBlock}`,
        },
      ],
    }),
  });

  const anthropicJson: unknown = await anthropicRes.json().catch(() => null);
  if (!anthropicRes.ok) {
    const errMsg =
      anthropicJson && typeof anthropicJson === "object" && "error" in anthropicJson
        ? JSON.stringify((anthropicJson as { error: unknown }).error)
        : anthropicRes.statusText;
    throw new Error(`AI-kald fejlede: ${errMsg}`);
  }

  const text = extractAnthropicText(anthropicJson);
  if (!text?.trim()) throw new Error("AI returnerede intet indhold.");
  const parsed = tryParseItReportAi(text);
  if (!parsed) throw new Error("AI-svar kunne ikke parses som gyldig JSON.");
  return parsed;
}

export async function generateItReportForOrganisation(
  admin: SupabaseClient,
  organisationId: string,
): Promise<{ id: string }> {
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  start.setUTCHours(0, 0, 0, 0);
  const period_start = start.toISOString().slice(0, 10);
  const period_end = end.toISOString().slice(0, 10);
  const startMs = start.getTime();
  const endMs = end.getTime();
  const sinceIso = start.toISOString();

  const { data: org, error: orgErr } = await admin
    .from("organisations")
    .select("id, name, domain")
    .eq("id", organisationId)
    .maybeSingle();
  if (orgErr) throw new Error(orgErr.message);
  if (!org) throw new Error("Organisation ikke fundet.");

  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .select("onboarding_systems")
    .eq("organisation_id", organisationId);
  if (profErr) throw new Error(profErr.message);

  const onboardingSet = new Set<string>();
  for (const p of profiles ?? []) {
    const os = (p as { onboarding_systems?: unknown }).onboarding_systems;
    if (Array.isArray(os)) {
      for (const x of os) {
        if (typeof x === "string" && x.trim()) onboardingSet.add(x.trim());
      }
    }
  }

  const { data: monRows, error: monErr } = await admin
    .from("monitoring_results")
    .select("system_name, status, checked_at")
    .eq("organisation_id", organisationId)
    .gte("checked_at", sinceIso)
    .order("checked_at", { ascending: false });
  if (monErr) throw new Error(monErr.message);

  const { data: tickets, error: tixErr } = await admin
    .from("tickets")
    .select("id, title, status, created_at")
    .eq("organisation_id", organisationId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false });
  if (tixErr) throw new Error(tixErr.message);

  const monList = (monRows ?? []) as MonRow[];
  const monitoring = buildMonitoringSectionFromRows(monList, startMs, endMs);

  const tixList = (tickets ?? []) as { id: string; title: string; status: string; created_at: string }[];
  const resolved = tixList.filter((t) => t.status === "resolved").length;
  const open = tixList.filter((t) => t.status === "active").length;

  const content: ITReportContentV1 = {
    version: 1,
    organisationName: String((org as { name?: string }).name ?? "Organisation"),
    domain: ((org as { domain?: string | null }).domain ?? null) as string | null,
    onboardingSystems: [...onboardingSet].sort((a, b) => a.localeCompare(b, "da")),
    monitoring,
    tickets: {
      totalCreated: tixList.length,
      resolved,
      open,
      rows: tixList.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        created_at: t.created_at,
      })),
    },
  };

  const dataBlock = [
    `Organisation: ${content.organisationName}`,
    `Domæne: ${content.domain ?? "—"}`,
    `Valgte systemer (onboarding): ${content.onboardingSystems.join(", ") || "—"}`,
    `Support: ${content.tickets.totalCreated} sager oprettet i perioden (${content.tickets.resolved} løst, ${content.tickets.open} stadig åbne).`,
    `Overvågning: ${monList.length} målinger i perioden.`,
    "",
    "Per system (venlige navne, seneste status, oppetid som andel OK-af målinger, seneste tjek):",
    ...monitoring.bySystem.map(
      (s) =>
        `- ${s.friendlyName}: seneste status=${s.lastStatus}, oppetid=${s.uptimePercent}%, senest tjekket=${s.lastChecked ?? "—"}`,
    ),
    "",
    "Sager (titel og status):",
    ...(tixList.length
      ? tixList.map((t) => `- ${t.title} [${t.status}] (${t.created_at})`)
      : ["- Ingen sager i perioden."]),
  ].join("\n");

  const ai = await callAnthropicItReport(dataBlock);

  const monthTitle = end.toLocaleDateString("da-DK", { month: "long", year: "numeric" });
  const title = `IT-rapport — ${content.organisationName} — ${monthTitle}`;

  const { data: inserted, error: insErr } = await admin
    .from("it_reports")
    .insert({
      organisation_id: organisationId,
      title,
      period_start,
      period_end,
      content,
      ai_summary: ai.ai_summary,
      ai_recommendations: ai.ai_recommendations,
      status: "draft",
    })
    .select("id")
    .single();

  if (insErr) throw new Error(insErr.message);
  const id = (inserted as { id?: string } | null)?.id;
  if (!id) throw new Error("Kunne ikke oprette rapport.");
  return { id };
}
