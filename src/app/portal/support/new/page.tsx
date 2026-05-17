"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePortalSession } from "@/components/portal/PortalLayout";
import { TicketForm, type TicketFormSubmitValues } from "@/components/tickets/TicketForm";
import { uploadFilesForTicket } from "@/lib/create-ticket-with-attachments";
import { fetchCurrentProfile } from "@/lib/current-profile";
import { createClient } from "@/lib/supabase";

function SubjectFromQuery({ onApply }: { onApply: (subject: string) => void }) {
  const searchParams = useSearchParams();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    const s = searchParams.get("subject")?.trim();
    if (!s) return;
    applied.current = true;
    onApply(s);
  }, [searchParams, onApply]);

  return null;
}

function PortalSupportNewPageInner() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const portalSession = usePortalSession();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [initialTitle, setInitialTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const profile = await fetchCurrentProfile(supabase, user.id);
      if (profile?.organisation_id) setOrgId(profile.organisation_id);
    })();
  }, [supabase]);

  const organisationId = orgId ?? portalSession?.organisationId ?? null;

  const applySubject = useCallback((subject: string) => {
    setInitialTitle(subject);
  }, []);

  const handleSubmit = async (values: TicketFormSubmitValues) => {
    setSubmitting(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      setError("Du er ikke logget ind.");
      setSubmitting(false);
      return;
    }
    if (!organisationId) {
      setError("Organisation ikke fundet.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/tickets", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: values.title,
        description: values.description,
      }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      ticket?: { id?: unknown };
    };

    if (!res.ok) {
      setError(payload.error ?? "Kunne ikke oprette sag.");
      setSubmitting(false);
      return;
    }

    const ticketId = typeof payload.ticket?.id === "string" ? payload.ticket.id : "";
    if (!ticketId) {
      setError("Sag blev oprettet men mangler id.");
      setSubmitting(false);
      return;
    }

    if (values.files.length > 0) {
      setUploadingFiles(true);
      const { error: uploadError } = await uploadFilesForTicket(supabase, {
        files: values.files,
        organisationId,
        ticketId,
        uploadedBy: user.id,
      });
      setUploadingFiles(false);
      if (uploadError) {
        setError(uploadError);
        setSubmitting(false);
        router.push(`/portal/support/${ticketId}`);
        return;
      }
    }

    setSubmitting(false);
    router.push(`/portal/support/${ticketId}`);
  };

  return (
    <div className="flex w-full flex-col gap-6 p-6 md:p-8">
      <Suspense fallback={null}>
        <SubjectFromQuery onApply={applySubject} />
      </Suspense>

      <div className="border-b border-[#D4C9A8] pb-6">
        <Link href="/portal/support" className="text-sm font-semibold text-[#8B9E6B] hover:underline">
          ← Tilbage til Support & sager
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-[#2C3020]">Ny sag</h1>
        <p className="mt-2 text-sm text-[#5C5A48]">
          Beskriv dit problem — vi vender tilbage hurtigst muligt.
        </p>
      </div>

      <div className="rounded-2xl border border-[#D4C9A8] bg-white p-6 shadow-sm">
        <TicketForm
          initialTitle={initialTitle}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/portal/support")}
          submitting={submitting}
          uploadingFiles={uploadingFiles}
          error={error}
          showCancel
          idPrefix="portal-new-ticket"
        />
      </div>
    </div>
  );
}

export default function PortalSupportNewPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full p-6 text-sm text-[#5C5A48] md:p-8">Indlæser…</div>
      }
    >
      <PortalSupportNewPageInner />
    </Suspense>
  );
}
