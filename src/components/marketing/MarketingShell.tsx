import type { ReactNode } from "react";
import { MarketingFooter } from "./MarketingFooter";
import { MarketingNav } from "./MarketingNav";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1E3448]">
      <MarketingNav />
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </div>
  );
}
