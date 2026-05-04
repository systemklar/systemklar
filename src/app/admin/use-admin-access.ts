"use client";

import { useEffect, useState } from "react";
import { isAdminEmail } from "@/lib/admin-email";
import { createClient } from "@/lib/supabase";

export type AdminAccessState = "loading" | "denied" | "allowed";

/**
 * Midlertidig: samme e-mail-tjek som middleware (én hardcodet admin).
 */
export function useAdminAccess() {
  const [access, setAccess] = useState<AdminAccessState>("loading");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const applySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session?.user) {
        setAccess("denied");
        return;
      }

      setAccess(isAdminEmail(session.user.email) ? "allowed" : "denied");
    };

    void applySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void applySession();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return access;
}
