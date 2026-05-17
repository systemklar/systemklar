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
      className={`border-b border-[#C8D8E4] ${className}`.trim()}
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
                  ? "border-[#4A7FA5] font-semibold text-[#1E3448]"
                  : "border-transparent text-[#7A9AB0] hover:text-[#4A6478]"
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
