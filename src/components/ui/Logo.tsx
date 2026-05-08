import Image from "next/image";

export function Logo({ white = false }: { white?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo-icon.png"
        alt=""
        width={32}
        height={32}
        className={white ? "brightness-0 invert" : undefined}
      />
      <span
        className={`font-semibold text-lg ${white ? "text-white" : "text-[#062840]"}`}
      >
        systemklar
      </span>
    </div>
  );
}
