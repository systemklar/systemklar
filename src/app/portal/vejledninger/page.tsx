"use client";

import { FileText, HelpCircle, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getGuideCategoryIcon } from "@/lib/guide-icons";
import { toVideoEmbedUrl } from "@/lib/video-embed";
import { createClient } from "@/lib/supabase";

type GuideCategoryRow = {
  id: string;
  name: string;
  icon_key: string;
  sort_order: number;
};

type GuideRow = {
  id: string;
  category_id: string;
  title: string;
  type: "video" | "faq" | "article";
  content: string;
  video_url: string | null;
  sort_order: number;
};

function previewText(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export default function PortalVejledningerPage() {
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState<GuideCategoryRow[]>([]);
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [articleModal, setArticleModal] = useState<GuideRow | null>(null);

  const load = useCallback(async () => {
    const [{ data: catData, error: catErr }, { data: guiData, error: guiErr }] = await Promise.all([
      supabase.from("guide_categories").select("id,name,icon_key,sort_order").order("sort_order"),
      supabase
        .from("guides")
        .select("id,category_id,title,type,content,video_url,sort_order")
        .eq("published", true)
        .order("sort_order"),
    ]);
    if (catErr) {
      setError(catErr.message);
      setCategories([]);
      setGuides([]);
      return;
    }
    if (guiErr) {
      setError(guiErr.message);
      setCategories((catData ?? []) as GuideCategoryRow[]);
      setGuides([]);
      return;
    }
    setError(null);
    setCategories((catData ?? []) as GuideCategoryRow[]);
    setGuides((guiData ?? []) as GuideRow[]);
  }, [supabase]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        await load();
        setLoading(false);
      })();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const filteredGuides = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = guides;
    if (filterCategoryId) {
      list = list.filter((g) => g.category_id === filterCategoryId);
    }
    if (q) {
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) || (g.content && g.content.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [guides, search, filterCategoryId]);

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-[#0D1F2D]">Vejledninger &amp; FAQ</h1>
          <p className="mt-2 text-sm text-[#4A8CB5]">Find svar og guides til systemklar.</p>
        </header>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        ) : null}

        <div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søg i titel og indhold..."
            className="w-full rounded-xl border border-sky-200 px-4 py-3 text-sm outline-none ring-sky-100 focus:border-sky-400 focus:ring-2"
          />
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Indlæser...</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilterCategoryId(null)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  filterCategoryId === null
                    ? "bg-sky-50 font-medium text-sky-700 ring-2 ring-sky-200"
                    : "text-[#2C4A5E] hover:bg-sky-50"
                }`}
              >
                Alle
              </button>
              {categories.map((c) => {
                const Icon = getGuideCategoryIcon(c.icon_key);
                const active = filterCategoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFilterCategoryId(c.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                      active
                        ? "bg-sky-50 font-medium text-sky-700 ring-2 ring-sky-200"
                        : "text-[#2C4A5E] hover:bg-sky-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-sky-600" aria-hidden />
                    {c.name}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredGuides.length === 0 ? (
                <p className="col-span-full rounded-2xl border border-sky-100 bg-white p-6 text-sm text-slate-600 shadow-sm">
                  Ingen vejledninger matcher dit valg endnu.
                </p>
              ) : (
                filteredGuides.map((g) => {
                  const embedUrl = g.type === "video" && g.video_url ? toVideoEmbedUrl(g.video_url) : null;

                  if (g.type === "video") {
                    const showPlayer = expandedVideoId === g.id && embedUrl;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        disabled={!embedUrl}
                        onClick={() => {
                          if (!embedUrl) return;
                          setExpandedVideoId((prev) => (prev === g.id ? null : g.id));
                        }}
                        className="rounded-2xl border border-sky-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-80"
                      >
                        <div className="flex justify-center">
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                            <Play className="h-6 w-6" aria-hidden />
                          </span>
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-[#0D1F2D]">{g.title}</h2>
                        {!embedUrl ? (
                          <p className="mt-2 text-xs text-amber-700">Video-URL kan ikke vises.</p>
                        ) : (
                          <>
                            {!showPlayer ? (
                              <p className="mt-3 text-xs text-[#4A8CB5]">Klik for at afspille</p>
                            ) : (
                              <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl border border-sky-100 bg-black">
                                <iframe
                                  title={g.title}
                                  src={embedUrl}
                                  className="h-full w-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                          </>
                        )}
                      </button>
                    );
                  }

                  if (g.type === "faq") {
                    const open = openFaqId === g.id;
                    return (
                      <div
                        key={g.id}
                        className="cursor-pointer rounded-2xl border border-sky-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                        role="button"
                        tabIndex={0}
                        onClick={() => setOpenFaqId((id) => (id === g.id ? null : g.id))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpenFaqId((id) => (id === g.id ? null : g.id));
                          }
                        }}
                      >
                        <span className="inline-flex rounded-full bg-amber-50 p-3 text-amber-600">
                          <HelpCircle className="h-6 w-6" aria-hidden />
                        </span>
                        <h2 className="mt-4 text-lg font-semibold text-[#0D1F2D]">{g.title}</h2>
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-out ${
                            open ? "mt-3 max-h-96 opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{g.content}</p>
                        </div>
                      </div>
                    );
                  }

                  const prev = previewText(g.content, 150);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setArticleModal(g)}
                      className="rounded-2xl border border-sky-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <span className="inline-flex rounded-full bg-green-50 p-3 text-green-600">
                        <FileText className="h-6 w-6" aria-hidden />
                      </span>
                      <h2 className="mt-4 text-lg font-semibold text-[#0D1F2D]">{g.title}</h2>
                      <p className="mt-3 line-clamp-4 text-sm text-slate-600">{prev}</p>
                      <p className="mt-4 text-xs font-medium text-sky-600">Læs mere</p>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {articleModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          onClick={() => setArticleModal(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-sky-100 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between gap-4">
              <h2 className="text-xl font-semibold text-[#0D1F2D]">{articleModal.title}</h2>
              <button
                type="button"
                onClick={() => setArticleModal(null)}
                className="shrink-0 rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Luk
              </button>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {articleModal.content}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
