import { MARKETING_CTA_NOTE } from "@/lib/marketing-cta";

export function MarketingCtaNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-xs text-[#7A9AB0] ${className}`.trim()}>{MARKETING_CTA_NOTE}</p>
  );
}
