import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const TESTIMONIALS = [
  {
    quote:
      "Endelig en IT-løsning vi forstår. Supporten er hurtig, og vi kan se status på alt uden at ringe rundt.",
    name: "Mette K.",
    role: "Butiksejer",
  },
  {
    quote:
      "Månedsrapporten giver vores bestyrelse overblik uden at vi skal samle data manuelt. Det sparer os timer.",
    name: "Lars H.",
    role: "Kontor / rådgivning",
  },
  {
    quote:
      "Da vores SSL udløb, fik vi besked med det samme. Det havde kostet os kunder hvis vi ikke havde haft overvågning.",
    name: "Sofie N.",
    role: "Restaurant",
  },
] as const;

export function HomeTestimonials() {
  return (
    <section className="bg-white px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <h2 className="marketing-section-heading text-center text-2xl md:text-3xl">
            Brugt af danske virksomheder
          </h2>
        </ScrollReveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <ScrollReveal key={item.name} staggerMs={index * 100}>
              <blockquote className="flex h-full flex-col rounded-2xl border border-[#CBD5E8] bg-white p-8 shadow-sm">
                <p className="flex-1 text-base leading-relaxed text-[#2A4868]">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-6 border-t border-[#E4EAF5] pt-5">
                  <p className="text-sm font-medium text-[#0A1628]">{item.name}</p>
                  <p className="mt-0.5 text-sm text-[#6A82A8]">{item.role}</p>
                </footer>
              </blockquote>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
