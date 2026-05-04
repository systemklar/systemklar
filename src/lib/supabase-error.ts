/** Serialize PostgREST / Supabase errors for logging (plain objects, not empty `{}`). */
export function formatSupabaseError(error: unknown): {
  message: string;
  code: string;
  details: string;
  hint: string;
  status?: string;
} {
  if (error instanceof Error) {
    const e = error as Error & {
      code?: unknown;
      details?: unknown;
      hint?: unknown;
      status?: unknown;
      statusCode?: unknown;
    };
    const toJson = (error as { toJSON?: () => unknown }).toJSON?.();
    if (toJson && typeof toJson === "object" && toJson !== null) {
      const j = toJson as Record<string, unknown>;
      return {
        message: j.message != null ? String(j.message) : error.message,
        code: j.code != null ? String(j.code) : e.code != null ? String(e.code) : "",
        details: j.details != null ? String(j.details) : e.details != null ? String(e.details) : "",
        hint: j.hint != null ? String(j.hint) : e.hint != null ? String(e.hint) : "",
        status:
          j.status != null
            ? String(j.status)
            : e.status != null
              ? String(e.status)
              : e.statusCode != null
                ? String(e.statusCode)
                : undefined,
      };
    }
    return {
      message: error.message,
      code: e.code != null ? String(e.code) : "",
      details: e.details != null ? String(e.details) : "",
      hint: e.hint != null ? String(e.hint) : "",
      status: e.status != null ? String(e.status) : e.statusCode != null ? String(e.statusCode) : undefined,
    };
  }
  if (error && typeof error === "object") {
    const e = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
      status?: unknown;
    };
    return {
      message: e.message != null ? String(e.message) : "",
      code: e.code != null ? String(e.code) : "",
      details: e.details != null ? String(e.details) : "",
      hint: e.hint != null ? String(e.hint) : "",
      status: e.status != null ? String(e.status) : undefined,
    };
  }
  return {
    message: error == null ? "" : String(error),
    code: "",
    details: "",
    hint: "",
  };
}

export function logSupabaseError(scope: string, error: unknown): void {
  const f = formatSupabaseError(error);
  const statusPart = f.status ? ` status=${f.status}` : "";
  const line = `${scope} code=${f.code || "(none)"} message=${f.message || "(none)"}${statusPart}`;
  console.error(line);
  if (f.details) console.error(`${scope} details:`, f.details);
  if (f.hint) console.error(`${scope} hint:`, f.hint);
  console.error(`${scope} full:`, JSON.stringify(f));
}
