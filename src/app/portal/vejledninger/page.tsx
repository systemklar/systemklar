"use client";

import { ChevronDown, FileText, HelpCircle, Play, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getGuideCategoryIcon } from "@/lib/guide-icons";
import { toVideoEmbedUrl } from "@/lib/video-embed";
import { PortalModalOverlay } from "@/components/portal/PortalOverlay";
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

const panelClass = "rounded-2xl border border-sky-100 bg-white p-6 shadow-sm";
const guideCardClass =
  "flex min-w-0 flex-col rounded-2xl border border-sky-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md";
const inputClass =
  "w-full rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm text-[#0D1F2D] outline-none placeholder:text-[#7AAEC8] focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

function previewText(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
        active
          ? "bg-sky-50 font-medium text-sky-800 ring-2 ring-sky-200"
          : "text-[#2C4A5E] hover:bg-sky-50 hover:text-sky-800"
      }`}
    >
      {children}
    </button>
  );
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
    <div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0D1F2D]">Vejledninger & FAQ</h1>
        <p className="mt-1 text-sm text-[#7AAEC8]">Find svar og guides til Systemklar.</p>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <section className={panelClass}>
        <label htmlFor="guide-search" className="sr-only">
          Søg i vejledninger
        </label>
        <input
          id="guide-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søg i titel og indhold..."
          className={inputClass}
        />
      </section>

      {loading ? (
        <div className={`${panelClass} space-y-3`} aria-busy>
          <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-sky-50" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-sky-50" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {categories.length > 0 ? (
            <section className={panelClass}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#7AAEC8]">
                Kategorier
              </p>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-x-visible md:pb-0">
                <CategoryPill active={filterCategoryId === null} onClick={() => setFilterCategoryId(null)}>
                  Alle
                </CategoryPill>
                {categories.map((c) => {
                  const Icon = getGuideCategoryIcon(c.icon_key);
                  return (
                    <CategoryPill
                      key={c.id}
                      active={filterCategoryId === c.id}
                      onClick={() => setFilterCategoryId(c.id)}
                    >
                      <Icon className="h-4 w-4 text-sky-600" aria-hidden />
                      {c.name}
                    </CategoryPill>
                  );
                })}
              </div>
            </section>
          ) : null}

          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
            {filteredGuides.length === 0 ? (
              <p className={`col-span-full ${panelClass} text-center text-sm text-[#2C4A5E]`}>
                Ingen vejledninger matcher dit valg endnu.
              </p>
            ) : (
              filteredGuides.map((g) => {
                const embedUrl =
                  g.type === "video" && g.video_url ? toVideoEmbedUrl(g.video_url) : null;

                if (g.type === "video") {
                  const showPlayer = expandedVideoId === g.id && embedUrl;
                  return (
                    <article key={g.id} className={guideCardClass}>
                      <div className="flex justify-center">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                          <Play className="h-6 w-6" aria-hidden />
                        </span>
                      </div>
                      <h2 className="mt-4 text-base font-semibold text-[#0D1F2D]">{g.title}</h2>
                      {!embedUrl ? (
                        <p className="mt-2 text-xs text-amber-700">Video-URL kan ikke vises.</p>
                      ) : showPlayer ? (
                        <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl border border-sky-100 bg-black">
                          <iframe
                            title={g.title}
                            src={embedUrl}
                            className="h-full w-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setExpandedVideoId(g.id)}
                          className="mt-3 text-left text-xs font-medium text-[#0A6EBD] hover:text-[#0859A0] hover:underline"
                        >
                          Klik for at afspille
                        </button>
                      )}
                      {showPlayer ? (
                        <button
                          type="button"
                          onClick={() => setExpandedVideoId(null)}
                          className="mt-3 text-left text-xs font-medium text-[#7AAEC8] hover:text-[#0A6EBD]"
                        >
                          Skjul video
                        </button>
                      ) : null}
                    </article>
                  );
                }

                if (g.type === "faq") {
                  const open = openFaqId === g.id;
                  return (
                    <article key={g.id} className={guideCardClass}>
                      <span className="inline-flex rounded-full bg-amber-50 p-3 text-amber-600">
                        <HelpCircle className="h-6 w-6" aria-hidden />
                      </span>
                      <h2 className="mt-4 text-base font-semibold text-[#0D1F2D]">{g.title}</h2>
                      <button
                        type="button"
                        onClick={() => setOpenFaqId((id) => (id === g.id ? null : g.id))}
                        className="mt-3 flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-[#0A6EBD] hover:text-[#0859A0]"
                        aria-expanded={open}
                      >
                        {open ? "Skjul svar" : "Vis svar"}
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                          aria-hidden
                        />
                      </button>
                      <div
                        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#2C4A5E]">
                            {g.content}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                }

                const prev = previewText(g.content, 150);
                return (
                  <article key={g.id} className={guideCardClass}>
                    <span className="inline-flex rounded-full bg-emerald-50 p-3 text-[#0A7C5C]">
                      <FileText className="h-6 w-6" aria-hidden />
                    </span>
                    <h2 className="mt-4 text-base font-semibold text-[#0D1F2D]">{g.title}</h2>
                    <p className="mt-3 line-clamp-4 text-sm text-[#2C4A5E]">{prev}</p>
                    <button
                      type="button"
                      onClick={() => setArticleModal(g)}
                      className="mt-4 text-left text-xs font-medium text-[#0A6EBD] hover:text-[#0859A0] hover:underline"
                    >
                      Læs mere
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </>
      )}

      {articleModal ? (
        <PortalModalOverlay open onClose={() => setArticleModal(null)}>
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-sky-100 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-article-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="guide-article-title" className="text-lg font-semibold text-[#0D1F2D]">
                {articleModal.title}
              </h2>
              <button
                type="button"
                onClick={() => setArticleModal(null)}
                className="shrink-0 rounded-full p-1.5 text-[#7AAEC8] transition hover:bg-sky-50 hover:text-[#0D1F2D]"
                aria-label="Luk"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#2C4A5E]">
              {articleModal.content}
            </p>
          </div>
        </PortalModalOverlay>
      ) : null}
    </div>
  );
}
