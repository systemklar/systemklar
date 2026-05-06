import type { LucideIcon } from "lucide-react";
import { FileText, HelpCircle, LayoutDashboard, Lock, MessageSquare, Monitor } from "lucide-react";

export const GUIDE_CATEGORY_ICON_KEYS = [
  "LayoutDashboard",
  "MessageSquare",
  "Lock",
  "FileText",
  "Monitor",
  "HelpCircle",
] as const;

export type GuideCategoryIconKey = (typeof GUIDE_CATEGORY_ICON_KEYS)[number];

const map: Record<GuideCategoryIconKey, LucideIcon> = {
  LayoutDashboard,
  MessageSquare,
  Lock,
  FileText,
  Monitor,
  HelpCircle,
};

export function getGuideCategoryIcon(key: string): LucideIcon {
  if (key in map) {
    return map[key as GuideCategoryIconKey];
  }
  return HelpCircle;
}
