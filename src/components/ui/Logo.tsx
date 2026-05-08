export function Logo({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  const primaryColor = isDark ? "#FFFFFF" : "#0A6EBD";
  const secondaryColor = isDark ? "#FFFFFF" : "#4FA8E0";

  return (
    <div className="flex items-center gap-2">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        role="img"
        aria-label="systemklar logo"
      >
        {/* S-formen (mørk blå på lys baggrund / hvid på mørk) */}
        <path
          d="M8 4h6a4 4 0 0 1 4 4v3h-5V9H8v3h6a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H4v-5h10v-3H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z"
          fill={primaryColor}
        />
        {/* K-formen (chevron, lys blå på lys baggrund / hvid på mørk) */}
        <path
          d="M19 4h3l8 12-8 12h-3l8-12L19 4Z"
          fill={secondaryColor}
        />
      </svg>
      <span
        style={{
          fontFamily: "Inter",
          fontWeight: 700,
          color: primaryColor,
          fontSize: "1.125rem",
          letterSpacing: "-0.01em",
        }}
      >
        systemklar
      </span>
    </div>
  );
}
