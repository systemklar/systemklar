import { BookDemoForm } from "@/components/marketing/BookDemoForm";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function BookDemoPage() {
  return (
    <MarketingShell>
      <main className="bg-[#F7F7F5] py-16 md:py-24">
        <div className="mx-auto w-full max-w-2xl px-6">
          <BookDemoForm />
        </div>
      </main>
    </MarketingShell>
  );
}
