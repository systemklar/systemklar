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
  className = "mt-8 mb-10",
}: SettingsTabsProps) {
  if (tabs.length <= 1) return null;

  return (
    <nav
      className={`border-b border-[#CBD5E8] ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <div className="-mb-px flex flex-wrap gap-10 gap-y-1">
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
                  ? "border-[#2952A3] font-semibold text-[#0A1628]"
                  : "border-transparent text-[#6A82A8] hover:text-[#2A4868]"
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
