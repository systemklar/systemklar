"use client";

export type SettingsTabItem = {
  id: string;
  label: string;
};

type SettingsTabsProps = {
  tabs: SettingsTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Accessible name for the tab list */
  ariaLabel?: string;
  /** Spacing below page subtitle (default: mt-6 mb-8) */
  className?: string;
};

/**
 * Underline-style tabs for portal settings pages.
 */
export function SettingsTabs({
  tabs,
  activeId,
  onChange,
  ariaLabel = "Sektioner",
  className = "mt-6 mb-8",
}: SettingsTabsProps) {
  if (tabs.length <= 1) return null;

  return (
    <nav
      className={`border-b border-[#D4C9A8] ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <div className="-mb-px flex flex-wrap gap-8 gap-y-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`border-b-2 px-1 pb-3 text-sm transition-colors ${
                isActive
                  ? "border-[#8B9E6B] font-semibold text-[#2C3020]"
                  : "border-transparent text-[#8C8A78] hover:text-[#5C5A48]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
