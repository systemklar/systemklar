"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export type AdminAccessState = "loading" | "denied" | "allowed";

/**
 * Samme adgangstjek som /admin: getSession + række i `public.admins`.
 */
export function useAdminAccess(logLabel = "[admin]") {
  const [access, setAccess] = useState<AdminAccessState>("loading");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const checkAdminsForUser = async (userId: string) => {
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", userId)
        .limit(1);

      console.log(`${logLabel} admins table query result`, {
        userId,
        data,
        error: error
          ? { message: error.message, code: error.code, details: error.details }
          : null,
        rowCount: (data ?? []).length,
      });

      if (cancelled) return;

      if (error) {
        console.error(`${logLabel} admins lookup`, error);
        setAccess("denied");
        return;
      }

      setAccess((data ?? []).length > 0 ? "allowed" : "denied");
    };

    const resolveSession = async (source: string) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      const userId = session?.user?.id ?? null;
      console.log(`${logLabel} getSession()`, {
        source,
        userId,
        sessionError: sessionError?.message ?? null,
        hasSession: !!session,
      });

      if (cancelled) return;

      if (!session?.user) {
        if (source === "INITIAL_SESSION" || source === "SIGNED_OUT") {
          setAccess("denied");
        }
        return;
      }

      if (
        source === "INITIAL_SESSION" ||
        source === "getSession(mount)" ||
        source === "SIGNED_IN"
      ) {
        setAccess("loading");
      }
      await checkAdminsForUser(session.user.id);
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        void resolveSession("getSession(mount)");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      void resolveSession(event);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [logLabel]);

  return access;
}
