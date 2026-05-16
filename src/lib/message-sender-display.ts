export const SYSTEMKLAR_SENDER_NAME = "Systemklar";

type MessageSenderFields = {
  sender_role: string | null;
  is_admin: boolean;
  sender_name?: string | null;
};

/** Beskeder fra Systemklar-support (admin), ikke kunde. */
export function isAdminMessage(message: Pick<MessageSenderFields, "sender_role" | "is_admin">): boolean {
  if (message.sender_role === "admin") return true;
  if (message.sender_role === "customer") return false;
  return message.is_admin === true;
}

/** Visningsnavn i tråd — admin vises altid som Systemklar. */
export function messageSenderDisplayName(
  message: Pick<MessageSenderFields, "sender_name" | "sender_role" | "is_admin">,
  customerFallbackLabel: string,
): string {
  if (isAdminMessage(message)) {
    return SYSTEMKLAR_SENDER_NAME;
  }
  return message.sender_name?.trim() || customerFallbackLabel;
}

/** Profil-rolle for afsender ved indsættelse (API). */
export function resolveMessageSenderForInsert(options: {
  sendAsAdmin: boolean;
  isSystemAdmin: boolean;
  profileRole: string | null | undefined;
  profileFullName: string | null | undefined;
  userEmail: string | null | undefined;
  customerFallback?: string;
}): { sender_name: string; sender_role: "admin" | "customer" } {
  const { sendAsAdmin, isSystemAdmin, profileRole, profileFullName, userEmail, customerFallback } =
    options;

  if (sendAsAdmin && (isSystemAdmin || profileRole === "admin")) {
    return { sender_name: SYSTEMKLAR_SENDER_NAME, sender_role: "admin" };
  }

  if (sendAsAdmin) {
    return { sender_name: SYSTEMKLAR_SENDER_NAME, sender_role: "admin" };
  }

  const name =
    profileFullName?.trim() ||
    userEmail?.trim() ||
    customerFallback?.trim() ||
    "Kunde";

  return { sender_name: name, sender_role: "customer" };
}
