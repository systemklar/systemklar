"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GUIDE_CATEGORY_ICON_KEYS,
  getGuideCategoryIcon,
  type GuideCategoryIconKey,
} from "@/lib/guide-icons";
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
  published: boolean;
  sort_order: number;
};

const TYPE_OPTS: { value: GuideRow["type"]; label: string }[] = [
  { value: "video", label: "Video" },
  { value: "faq", label: "FAQ" },
  { value: "article", label: "Artikel" },
];

function typeBadgeClasses(t: GuideRow["type"]): string {
  if (t === "video") return "bg-[#EEF2E6] text-[#2C3020] border border-[#D4C9A8]";
  if (t === "faq") return "bg-purple-100 text-purple-900 border border-purple-200";
  return "bg-emerald-100 text-emerald-900 border border-emerald-200";
}

export default function AdminVejledningerClient() {
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState<GuideCategoryRow[]>([]);
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);

  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<GuideRow | null>(null);
  const [gTitle, setGTitle] = useState("");
  const [gType, setGType] = useState<GuideRow["type"]>("faq");
  const [gCategoryId, setGCategoryId] = useState<string>("");
  const [gContent, setGContent] = useState("");
  const [gVideoUrl, setGVideoUrl] = useState("");
  const [gPublished, setGPublished] = useState(false);
  const [gSort, setGSort] = useState(0);
  const [guideSaving, setGuideSaving] = useState(false);
  const [guideErr, setGuideErr] = useState<string | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cIcon, setCIcon] = useState<GuideCategoryIconKey>("HelpCircle");
  const [cSort, setCSort] = useState(0);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryErr, setCategoryErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [{ data: catData, error: catErr }, { data: guiData, error: guiErr }] = await Promise.all([
      supabase.from("guide_categories").select("id,name,icon_key,sort_order").order("sort_order"),
      supabase.from("guides").select("id,category_id,title,type,content,video_url,published,sort_order").order("sort_order"),
    ]);
    if (catErr) {
      setLoadError(catErr.message);
      setCategories([]);
      setGuides([]);
      return false;
    }
    if (guiErr) {
      setLoadError(guiErr.message);
      setCategories((catData ?? []) as GuideCategoryRow[]);
      setGuides([]);
      return false;
    }
    setLoadError(null);
    setCategories((catData ?? []) as GuideCategoryRow[]);
    setGuides((guiData ?? []) as GuideRow[]);
    return true;
  }, [supabase]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setLoadError(null);
        await refresh();
        setLoading(false);
      })();
    }, 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

  const filteredGuides = useMemo(() => {
    if (!filterCategoryId) return guides;
    return guides.filter((g) => g.category_id === filterCategoryId);
  }, [guides, filterCategoryId]);

  const openNewGuide = () => {
    setEditingGuide(null);
    setGTitle("");
    setGType("faq");
    setGCategoryId(categories[0]?.id ?? "");
    setGContent("");
    setGVideoUrl("");
    setGPublished(false);
    setGSort(0);
    setGuideErr(null);
    setGuideModalOpen(true);
  };

  const openEditGuide = (g: GuideRow) => {
    setEditingGuide(g);
    setGTitle(g.title);
    setGType(g.type);
    setGCategoryId(g.category_id);
    setGContent(g.content);
    setGVideoUrl(g.video_url ?? "");
    setGPublished(g.published);
    setGSort(g.sort_order);
    setGuideErr(null);
    setGuideModalOpen(true);
  };

  const saveGuide = async () => {
    if (!gTitle.trim()) {
      setGuideErr("Titel er påkrævet.");
      return;
    }
    if (!gCategoryId) {
      setGuideErr("Vælg en kategori.");
      return;
    }
    if (gType === "video" && !gVideoUrl.trim()) {
      setGuideErr("Video-URL er påkrævet for video-vejledninger.");
      return;
    }
    setGuideSaving(true);
    setGuideErr(null);
    const base = {
      category_id: gCategoryId,
      title: gTitle.trim(),
      type: gType,
      content: gType === "video" ? "" : gContent,
      video_url: gType === "video" ? gVideoUrl.trim() : null,
      published: gPublished,
      sort_order: gSort,
    };
    if (editingGuide) {
      const { error } = await supabase
        .from("guides")
        .update({ ...base, updated_at: new Date().toISOString() })
        .eq("id", editingGuide.id);
      setGuideSaving(false);
      if (error) {
        setGuideErr(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("guides").insert(base);
      setGuideSaving(false);
      if (error) {
        setGuideErr(error.message);
        return;
      }
    }
    setGuideModalOpen(false);
    await refresh();
  };

  const deleteGuide = async (g: GuideRow) => {
    if (!window.confirm(`Slet vejledningen "${g.title}"?`)) return;
    const { error } = await supabase.from("guides").delete().eq("id", g.id);
    if (error) {
      window.alert(error.message);
      return;
    }
    await refresh();
  };

  const togglePublished = async (g: GuideRow) => {
    const { error } = await supabase
      .from("guides")
      .update({ published: !g.published, updated_at: new Date().toISOString() })
      .eq("id", g.id);
    if (error) {
      window.alert(error.message);
      return;
    }
    await refresh();
  };

  const openCategoryModal = () => {
    setCName("");
    setCIcon("HelpCircle");
    setCSort(categories.length);
    setCategoryErr(null);
    setCategoryModalOpen(true);
  };

  const saveCategory = async () => {
    if (!cName.trim()) {
      setCategoryErr("Navn er påkrævet.");
      return;
    }
    setCategorySaving(true);
    setCategoryErr(null);
    const { error } = await supabase.from("guide_categories").insert({
      name: cName.trim(),
      icon_key: cIcon,
      sort_order: cSort,
    });
    setCategorySaving(false);
    if (error) {
      setCategoryErr(error.message);
      return;
    }
    setCategoryModalOpen(false);
    await refresh();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3020] md:text-3xl">Vejledninger &amp; FAQ</h1>
          <p className="mt-1 text-sm text-[#5C5A48]">
            Opsæt hjælpetekster og guides som kunderne ser i portalen (kun publiceret).
          </p>
        </div>
        <button
          type="button"
          onClick={() => openNewGuide()}
          disabled={categories.length === 0}
          className="rounded-full bg-[#8B9E6B] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#7A8A5A] disabled:cursor-not-allowed disabled:opacity-50"
          title={categories.length === 0 ? "Opret først en kategori" : undefined}
        >
          Ny vejledning
        </button>
      </header>

      {loadError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{loadError}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Indlæser...</p>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full shrink-0 lg:w-1/3">
            <nav className="space-y-2 rounded-2xl border border-[#D4C9A8] bg-white p-3 shadow-sm">
              <button
                type="button"
                onClick={() => setFilterCategoryId(null)}
                className={`flex w-full items-center rounded-xl border px-4 py-3 text-left text-sm transition ${
                  filterCategoryId === null
                    ? "border-[#D4C9A8] bg-[#EEF2E6] border-l-2 border-l-[#8B9E6B] pl-[14px]"
                    : "border-transparent hover:bg-[#EEF2E6]/60"
                }`}
              >
                <span className="font-semibold text-[#2C3020]">Alle</span>
              </button>
              {categories.map((c) => {
                const Icon = getGuideCategoryIcon(c.icon_key);
                const active = filterCategoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFilterCategoryId(c.id)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition ${
                      active
                        ? "border-[#D4C9A8] bg-[#EEF2E6] border-l-2 border-l-[#8B9E6B] pl-[14px]"
                        : "border-transparent hover:bg-[#EEF2E6]/60"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#8B9E6B]" aria-hidden />
                    <span className="font-semibold text-[#2C3020]">{c.name}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => openCategoryModal()}
                className="mt-2 w-full rounded-xl border border-dashed border-[#D4C9A8] py-2 text-sm font-medium text-[#7A8A5A] hover:bg-[#EEF2E6]"
              >
                Ny kategori
              </button>
            </nav>
          </div>

          <div className="min-w-0 flex-1 space-y-4 lg:w-2/3">
            {filteredGuides.length === 0 ? (
              <p className="rounded-2xl border border-[#D4C9A8] bg-white p-6 text-sm text-slate-600 shadow-sm">
                Ingen vejledninger i denne visning. Opret en kategori og en vejledning for at komme i gang.
              </p>
            ) : (
              filteredGuides.map((g) => (
                <div
                  key={g.id}
                  className="rounded-2xl border border-[#D4C9A8] bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadgeClasses(g.type)}`}>
                          {g.type === "video" ? "Video" : g.type === "faq" ? "FAQ" : "Artikel"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            g.published
                              ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                              : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                          }`}
                        >
                          {g.published ? "Publiceret" : "Kladde"}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold text-[#2C3020]">{g.title}</h2>
                      <p className="text-xs text-[#5C5A48]">
                        Kategori:{" "}
                        <span className="font-medium">{categories.find((c) => c.id === g.category_id)?.name ?? "—"}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void togglePublished(g)}
                        className="rounded-full border border-[#D4C9A8] px-3 py-1.5 text-xs font-semibold text-[#7A8A5A] hover:bg-[#EEF2E6]"
                      >
                        {g.published ? "Afpublicer" : "Publicer"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditGuide(g)}
                        className="rounded-full bg-[#8B9E6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7A8A5A]"
                      >
                        Rediger
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteGuide(g)}
                        className="rounded-full border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Slet
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {guideModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#D4C9A8] bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#2C3020]">
              {editingGuide ? "Rediger vejledning" : "Ny vejledning"}
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#2C3020]">Titel</label>
                <input
                  value={gTitle}
                  onChange={(e) => setGTitle(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#D4C9A8] px-4 py-2 text-sm outline-none focus:border-[#E8E2D0]0"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#2C3020]">Type</label>
                <select
                  value={gType}
                  onChange={(e) => setGType(e.target.value as GuideRow["type"])}
                  className="w-full rounded-xl border border-[#D4C9A8] px-4 py-2 text-sm outline-none focus:border-[#E8E2D0]0"
                >
                  {TYPE_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#2C3020]">Kategori</label>
                <select
                  value={gCategoryId}
                  onChange={(e) => setGCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-[#D4C9A8] px-4 py-2 text-sm outline-none focus:border-[#E8E2D0]0"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {gType === "video" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#2C3020]">Video-URL (YouTube / Vimeo)</label>
                  <input
                    value={gVideoUrl}
                    onChange={(e) => setGVideoUrl(e.target.value)}
                    className="w-full rounded-xl border border-[#D4C9A8] px-4 py-2 text-sm outline-none focus:border-[#E8E2D0]0"
                    placeholder="https://..."
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#2C3020]">
                    Indhold (ren tekst, linjeskift tilladt)
                  </label>
                  <textarea
                    value={gContent}
                    onChange={(e) => setGContent(e.target.value)}
                    rows={10}
                    className="w-full rounded-xl border border-[#D4C9A8] px-4 py-3 text-sm outline-none focus:border-[#E8E2D0]0"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  id="g-pub"
                  type="checkbox"
                  checked={gPublished}
                  onChange={(e) => setGPublished(e.target.checked)}
                  className="rounded border-[#D4C9A8] text-[#8B9E6B]"
                />
                <label htmlFor="g-pub" className="text-sm text-[#2C3020]">
                  Publiceret
                </label>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#2C3020]">
                  Sorteringsrækkefølge
                </label>
                <input
                  type="number"
                  value={gSort}
                  onChange={(e) => setGSort(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[#D4C9A8] px-4 py-2 text-sm outline-none focus:border-[#E8E2D0]0"
                />
              </div>
              {guideErr ? <p className="text-sm text-red-600">{guideErr}</p> : null}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={guideSaving}
                  onClick={() => void saveGuide()}
                  className="rounded-full bg-[#8B9E6B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#7A8A5A] disabled:opacity-60"
                >
                  {guideSaving ? "Gemmer..." : "Gem"}
                </button>
                <button
                  type="button"
                  onClick={() => setGuideModalOpen(false)}
                  className="rounded-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Luk
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {categoryModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-md rounded-2xl border border-[#D4C9A8] bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#2C3020]">Ny kategori</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#2C3020]">Navn</label>
                <input
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="w-full rounded-xl border border-[#D4C9A8] px-4 py-2 text-sm outline-none focus:border-[#E8E2D0]0"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#2C3020]">Ikon</label>
                <select
                  value={cIcon}
                  onChange={(e) => setCIcon(e.target.value as GuideCategoryIconKey)}
                  className="w-full rounded-xl border border-[#D4C9A8] px-4 py-2 text-sm outline-none focus:border-[#E8E2D0]0"
                >
                  {GUIDE_CATEGORY_ICON_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#2C3020]">
                  Sorteringsrækkefølge
                </label>
                <input
                  type="number"
                  value={cSort}
                  onChange={(e) => setCSort(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[#D4C9A8] px-4 py-2 text-sm outline-none focus:border-[#E8E2D0]0"
                />
              </div>
              {categoryErr ? <p className="text-sm text-red-600">{categoryErr}</p> : null}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={categorySaving}
                  onClick={() => void saveCategory()}
                  className="rounded-full bg-[#8B9E6B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#7A8A5A] disabled:opacity-60"
                >
                  {categorySaving ? "Gemmer..." : "Gem kategori"}
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="rounded-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Luk
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
