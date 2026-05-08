import Image from "next/image";

export function Logo({ variant = "light" }: { variant?: "light" | "dark" }) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo-icon.png"
        alt="systemklar"
        width={32}
        height={32}
        className={variant === "dark" ? "brightness-0 invert" : undefined}
      />
      <span
        style={{
          fontFamily: "Inter",
          fontWeight: 700,
          color: variant === "dark" ? "#FFFFFF" : "#0A6EBD",
          fontSize: "1.125rem",
          letterSpacing: "-0.01em",
        }}
      >
        systemklar
      </span>
    </div>
  );
}
