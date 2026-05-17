import { MARKETING_CTA_NOTE } from "@/lib/marketing-cta";

export function MarketingCtaNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-xs text-[#6A82A8] ${className}`.trim()}>{MARKETING_CTA_NOTE}</p>
  );
}
