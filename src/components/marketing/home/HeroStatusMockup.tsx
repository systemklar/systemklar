"use client";

const SYSTEMS = [
  { name: "Hjemmeside", status: "OK" },
  { name: "SSL-certifikat", status: "OK" },
  { name: "Email-sikkerhed", status: "OK" },
  { name: "Domæne", status: "OK" },
] as const;

export function HeroStatusMockup() {
  return (
    <div
      className="w-full max-w-md rounded-2xl border border-[#C8D8E4] bg-white p-6 shadow-[0_8px_32px_rgba(30,52,72,0.06)]"
      aria-hidden
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#E0EAF0] pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#7A9AB0]">Systemstatus</p>
          <p className="mt-1 text-lg font-light text-[#1E3448]">Alt kører som det skal</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B8D8C0] bg-[#EEF7F0] px-2.5 py-1 text-xs font-medium text-[#3A7A4A]">
          <span className="marketing-status-dot h-1.5 w-1.5 rounded-full bg-[#5A9A6A]" />
          OK
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {SYSTEMS.map((row, i) => (
          <li
            key={row.name}
            className="flex items-center justify-between rounded-xl border border-[#E0EAF0] bg-[#F7F4EF]/60 px-4 py-3"
          >
            <span className="text-sm text-[#4A6478]">{row.name}</span>
            <span className="flex items-center gap-2 text-xs font-medium text-[#3A7A4A]">
              <span
                className="marketing-status-dot h-2 w-2 rounded-full bg-[#5A9A6A]"
                style={{ animationDelay: `${i * 0.35}s` }}
              />
              {row.status}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-center text-[11px] text-[#7A9AB0]">Sidst tjekket for 4 min. siden</p>
    </div>
  );
}
