"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_EMAIL_TEMPLATE_ROWS, getDescriptionForTemplateId } from "@/lib/email-template-defaults";
import { emailOuterHtml } from "@/lib/email-layout";
import { createClient } from "@/lib/supabase";

type TemplateRow = {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[] | null;
  updated_at?: string;
};

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

const PREVIEW_BTN =
  '<a href="#" style="pointer-events:none;display:inline-block;background:#4A7FA5;color:white;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;margin:16px 0;">Eksempel-knap</a>';

function buildPreviewVars(variableKeys: string[]): Record<string, string> {
  const samples: Record<string, string> = {
    name: "Anders Jensen",
    contactName: "Mette Nielsen",
    orgName: "Møllers VVS",
    ticketTitle: "Printer virker ikke",
    month: "april 2026",
    messagePreview: "Vi kigger på det med det samme...",
    message: "Kort tekst fra afsenderen.",
    email: "anders@firma.dk",
    phone: "+45 40 40 40 40",
    company: "Møllers VVS AB",
    createdBy: "Anders Jensen",
  };
  const vars: Record<string, string> = {};
  for (const key of variableKeys) {
    if (/Button$/i.test(key)) {
      vars[key] = PREVIEW_BTN;
    } else {
      vars[key] = samples[key] ?? `{{${key}}}`;
    }
  }
  return vars;
}

function sortByDefaultOrder(rows: TemplateRow[]): TemplateRow[] {
  const order = DEFAULT_EMAIL_TEMPLATE_ROWS.map((r) => r.id as string);
  return [...rows].sort((a, b) => order.indexOf(a.id as string) - order.indexOf(b.id as string));
}

type EditorProps = {
  row: TemplateRow;
  variableKeys: string[];
  supabase: ReturnType<typeof createClient>;
  onApplied: (row: TemplateRow) => void;
};

function TemplateEditor({ row, variableKeys, supabase, onApplied }: EditorProps) {
  const [draftSubject, setDraftSubject] = useState(row.subject);
  const [draftBody, setDraftBody] = useState(row.body);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const previewHtmlDoc = useMemo(() => {
    if (!previewOpen) return "";
    const vars = buildPreviewVars(variableKeys);
    const inner = interpolate(draftBody, vars);
    const outer = emailOuterHtml(inner);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:16px;background:#F7F4EF;">${outer}</body></html>`;
  }, [previewOpen, draftBody, variableKeys]);

  const previewSubject = useMemo(() => {
    if (!previewOpen) return "";
    const vars = buildPreviewVars(variableKeys);
    return interpolate(draftSubject, vars);
  }, [previewOpen, draftSubject, variableKeys]);

  const copyVariable = async (key: string) => {
    const text = `{{${key}}}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      console.error("[admin/emails] clipboard", text);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    const trimmedSubject = draftSubject.trim();
    const { error } = await supabase
      .from("email_templates")
      .update({
        subject: trimmedSubject,
        body: draftBody,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) {
      setSaveMessage({ type: "err", text: error.message });
      return;
    }
    setSaveMessage({ type: "ok", text: "Gemt!" });
    onApplied({ ...row, subject: trimmedSubject, body: draftBody });
  };

  const handleReset = async () => {
    const def = DEFAULT_EMAIL_TEMPLATE_ROWS.find((r) => r.id === row.id);
    if (!def) return;
    const ok = window.confirm("Nulstille emne og indhold til standardversionen?");
    if (!ok) return;
    setSaving(true);
    setSaveMessage(null);
    const { error } = await supabase
      .from("email_templates")
      .update({
        subject: def.subject,
        body: def.body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) {
      setSaveMessage({ type: "err", text: error.message });
      return;
    }
    setDraftSubject(def.subject);
    setDraftBody(def.body);
    setSaveMessage({ type: "ok", text: "Nulstillet og gemt." });
    onApplied({ ...row, subject: def.subject, body: def.body });
  };

  return (
    <div className="rounded-2xl border border-[#C8D8E4] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#1E3448]">{row.name}</h2>
      <p className="mt-1 text-xs text-slate-500">Id: {row.id}</p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="tpl-subject" className="mb-1 block text-sm font-medium text-[#1E3448]">
            Emne
          </label>
          <input
            id="tpl-subject"
            type="text"
            value={draftSubject}
            onChange={(e) => setDraftSubject(e.target.value)}
            className="w-full rounded-xl border border-[#C8D8E4] px-4 py-2 text-sm outline-none focus:border-[#E0EAF0]0"
          />
        </div>
        <div>
          <label htmlFor="tpl-body" className="mb-1 block text-sm font-medium text-[#1E3448]">
            Indhold (HTML)
          </label>
          <textarea
            id="tpl-body"
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            className="min-h-[300px] w-full rounded-xl border border-[#C8D8E4] px-4 py-3 font-mono text-sm outline-none focus:border-[#E0EAF0]0"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {variableKeys.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => void copyVariable(v)}
                className="rounded-full bg-[#EAF1F7] px-2 py-0.5 font-mono text-xs text-[#3A6F95]"
                title="Kopier til udklipsholder"
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setPreviewOpen((o) => !o)}
          className="rounded-full border border-[#C8D8E4] px-4 py-2 text-sm font-semibold text-[#3A6F95] hover:bg-[#EAF1F7]"
        >
          {previewOpen ? "Skjul preview" : "Se preview"}
        </button>
      </div>

      {previewOpen ? (
        <div className="mt-4 space-y-2 rounded-xl border border-[#C8D8E4] bg-[#F7F4EF] p-4">
          <p className="text-xs font-medium text-slate-600">Emne (preview)</p>
          <p className="text-sm text-[#1E3448]">{previewSubject}</p>
          <iframe
            title="Email preview"
            sandbox=""
            className="mt-2 h-[420px] w-full rounded-lg border border-[#C8D8E4] bg-white"
            srcDoc={previewHtmlDoc}
          />
        </div>
      ) : null}

      {saveMessage ? (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            saveMessage.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {saveMessage.text}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-full bg-[#4A7FA5] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#3A6F95] disabled:opacity-50"
        >
          {saving ? "Gemmer..." : "Gem ændringer"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleReset()}
          className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Nulstil til standard
        </button>
      </div>
    </div>
  );
}

export default function AdminEmailsClient() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refreshRows = useCallback(async () => {
    const { data, error } = await supabase.from("email_templates").select("id,name,subject,body,variables,updated_at");
    if (error) {
      setLoadError(error.message);
      setRows([]);
      setSelectedId(null);
      return false;
    }
    const sorted = sortByDefaultOrder((data ?? []) as TemplateRow[]);
    setLoadError(null);
    setRows(sorted);
    setSelectedId((prev) => {
      if (prev && sorted.some((r) => r.id === prev)) return prev;
      return sorted[0]?.id ?? null;
    });
    return true;
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setLoadError(null);
        await refreshRows();
        setLoading(false);
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshRows]);

  const activeRow = rows.find((r) => r.id === selectedId) ?? null;

  const activeVariableKeys = useMemo(() => {
    if (!activeRow) return [];
    if (activeRow.variables && activeRow.variables.length > 0) return activeRow.variables;
    const def = DEFAULT_EMAIL_TEMPLATE_ROWS.find((r) => r.id === activeRow.id);
    return def ? [...def.variables] : [];
  }, [activeRow]);

  const patchRowInState = useCallback((updated: TemplateRow) => {
    setRows((prev) =>
      sortByDefaultOrder(prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))),
    );
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-[#1E3448] md:text-3xl">Email-skabeloner</h1>
        <p className="mt-2 text-sm text-[#4A6478]">Rediger de emails der sendes automatisk fra systemklar.</p>
      </header>

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Henter skabeloner...</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-[#C8D8E4] bg-white p-6 text-sm text-slate-600 shadow-sm">
          Ingen skabeloner fundet. Kør SQL-migrationen i Supabase (se <code className="text-xs">supabase/migrations/013_email_templates.sql</code>).
        </p>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full shrink-0 lg:w-1/3">
            <nav className="space-y-2 rounded-2xl border border-[#C8D8E4] bg-white p-3 shadow-sm">
              {rows.map((row) => {
                const isActive = row.id === selectedId;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? "border-[#C8D8E4] bg-[#EAF1F7] border-l-2 border-l-[#4A7FA5] pl-[14px]"
                        : "border-transparent hover:bg-[#EAF1F7]/60"
                    }`}
                  >
                    <p className="font-semibold text-[#1E3448]">{row.name}</p>
                    <p className="mt-1 text-xs text-[#4A6478]">{getDescriptionForTemplateId(row.id)}</p>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="min-w-0 flex-1 lg:w-2/3">
            {activeRow ? (
              <TemplateEditor
                key={activeRow.id}
                row={activeRow}
                variableKeys={activeVariableKeys}
                supabase={supabase}
                onApplied={patchRowInState}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
