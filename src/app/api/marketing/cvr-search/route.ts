import { NextResponse } from "next/server";
import { mapCvrApiResult } from "@/lib/it-cost-calculator";

const CVR_USER_AGENT = "systemklar.dk - IT-risiko beregner - kontakt@systemklar.dk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const isCvr = /^\d{6,8}$/.test(query.replace(/\s/g, ""));
  const url = new URL("https://cvrapi.dk/api");
  url.searchParams.set("country", "dk");
  if (isCvr) {
    url.searchParams.set("vat", query.replace(/\s/g, ""));
  } else {
    url.searchParams.set("search", query);
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": CVR_USER_AGENT },
      next: { revalidate: 3600 },
    });

    const data: unknown = await res.json();

    if (data && typeof data === "object" && "error" in data) {
      const err = data as { error?: string; message?: string };
      return NextResponse.json(
        { error: err.message ?? err.error ?? "CVR-opslag fejlede" },
        { status: res.status === 200 ? 502 : res.status },
      );
    }

    const list = Array.isArray(data) ? data : data ? [data] : [];
    const results = list
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map(mapCvrApiResult)
      .filter((c) => c.name && c.cvr);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Kunne ikke hente CVR-data. Prøv igen." }, { status: 502 });
  }
}
