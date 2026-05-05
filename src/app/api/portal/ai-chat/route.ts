import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const MODEL = "claude-sonnet-4-20250514";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

function toBulletList(lines: string[]): string {
  if (!lines.length) return "- Ingen data.";
  return lines.map((line) => `- ${line}`).join("\n");
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const rawMessages =
    body && typeof body === "object" && "messages" in body
      ? (body as { messages?: unknown }).messages
      : null;

  if (!Array.isArray(rawMessages)) {
    return NextResponse.json({ error: "messages skal være en liste." }, { status: 400 });
  }

  const messages: ChatMessage[] = rawMessages
    .filter((m): m is { role?: unknown; content?: unknown } => !!m && typeof m === "object")
    .map(
      (m): ChatMessage => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: typeof m.content === "string" ? m.content.trim() : "",
      }),
    )
    .filter((m) => m.content.length > 0)
    .slice(-10);

  if (messages.length === 0) {
    return NextResponse.json({ error: "Mindst én besked kræves." }, { status: 400 });
  }

  const [profileRes, ticketsRes, systemsRes, reportsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("company_name, plan")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("tickets")
      .select("title, status, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("systems")
      .select("name, type, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reports")
      .select("title, status_summary, recommendations, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileRes.error || ticketsRes.error || systemsRes.error || reportsRes.error) {
    console.error("[api/portal/ai-chat] data fetch error", {
      profile: profileRes.error,
      tickets: ticketsRes.error,
      systems: systemsRes.error,
      reports: reportsRes.error,
    });
    return NextResponse.json({ error: "Kunne ikke hente kundedata." }, { status: 500 });
  }

  const companyName = profileRes.data?.company_name?.trim() || "kunden";
  const plan = profileRes.data?.plan?.trim() || "ukendt";

  const systems = (systemsRes.data ?? []) as { name: string; type: string; status: string }[];
  const tickets = (ticketsRes.data ?? []) as {
    title: string;
    status: string;
    description: string | null;
    created_at: string;
  }[];
  const report = (reportsRes.data ?? null) as {
    title?: string | null;
    status_summary?: string | null;
    recommendations?: string | null;
  } | null;

  const activeTickets = tickets.filter((t) => t.status === "active");
  const resolvedTickets = tickets.filter((t) => t.status === "resolved").slice(0, 5);

  const systemsList = toBulletList(
    systems.map((s) => `${s.name} (${s.type}) - status: ${s.status}`),
  );
  const activeTicketsList = toBulletList(
    activeTickets.map(
      (t) =>
        `${t.title} (${new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" }).format(new Date(t.created_at))})${
          t.description?.trim() ? ` - ${t.description.trim()}` : ""
        }`,
    ),
  );
  const resolvedTicketsList = toBulletList(
    resolvedTickets.map(
      (t) =>
        `${t.title} (${new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" }).format(new Date(t.created_at))})`,
    ),
  );
  const latestReportText = report
    ? `Titel: ${report.title?.trim() || "Ukendt"}
Statusoversigt: ${report.status_summary?.trim() || "Ingen opsummering"}
Anbefalinger: ${report.recommendations?.trim() || "Ingen anbefalinger"}`
    : "Ingen rapport fundet.";

  const systemPrompt = `Du er en hjælpsom IT-assistent for Systemklar der hjælper ${companyName}.
Kunden er på ${plan}-planen.

KUNDENS SYSTEMER:
${systemsList}

AKTIVE SAGER:
${activeTicketsList}

LØSTE SAGER (seneste 5):
${resolvedTicketsList}

SENESTE IT-RAPPORT:
${latestReportText}

Svar altid på dansk. Vær præcis og hjælpsom.
Henvis til specifikke sager/systemer når relevant.
Foreslå at oprette en ny sag hvis problemet er nyt.
Adgangskoder og kodebank må ALDRIG nævnes.`;

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
      max_tokens: 1200,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  const anthropicJson: unknown = await anthropicRes.json().catch(() => null);
  if (!anthropicRes.ok) {
    const errMsg =
      anthropicJson && typeof anthropicJson === "object" && "error" in anthropicJson
        ? JSON.stringify((anthropicJson as { error: unknown }).error)
        : anthropicRes.statusText;
    console.error("[api/portal/ai-chat] anthropic", anthropicRes.status, errMsg);
    return NextResponse.json({ error: `AI-kald fejlede: ${errMsg}` }, { status: 502 });
  }

  const answer = extractAnthropicText(anthropicJson);
  if (!answer?.trim()) {
    return NextResponse.json({ error: "AI returnerede intet indhold." }, { status: 502 });
  }

  return NextResponse.json({
    answer: answer.trim(),
  });
}
