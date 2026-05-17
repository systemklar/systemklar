import { NextResponse } from "next/server";

const FALLBACK_HOURLY = 350;

/** Median timeløn via DST LONS40 (BRANCHE07) — LONS10 har ikke branchevariabel. */
async function fetchDstHourlyWage(branche07: string): Promise<number | null> {
  const params = new URLSearchParams({
    Tid: "2023",
    BRANCHE07: branche07,
    "LØNMÅL": "MEDIAN",
    SEKTOR: "1000",
    AFLOEN: "TIME",
    LONGRP: "LTOT",
    KØN: "MOK",
  });

  const url = `https://api.statbank.dk/v1/data/LONS40/CSV?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const csv = await res.text();
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return null;

  const valueCell = lines[lines.length - 1].split(";").pop()?.trim().replace(",", ".");
  const hourly = valueCell ? parseFloat(valueCell) : NaN;
  if (!Number.isFinite(hourly) || hourly <= 0) return null;
  return Math.round(hourly);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branche07 = (searchParams.get("branche07") ?? "TOT").toUpperCase();

  try {
    const hourly = await fetchDstHourlyWage(branche07);
    if (hourly) {
      return NextResponse.json({
        hourly,
        branche07,
        source: "dst",
        year: 2023,
      });
    }
  } catch {
    /* fallback below */
  }

  return NextResponse.json({
    hourly: FALLBACK_HOURLY,
    branche07,
    source: "fallback",
    year: 2023,
  });
}
