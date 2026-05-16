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
};

/**
 * Underline-style tabs for portal settings pages.
 */
export function SettingsTabs({
  tabs,
  activeId,
  onChange,
  ariaLabel = "Sektioner",
}: SettingsTabsProps) {
  if (tabs.length <= 1) return null;

  return (
    <nav className="mb-6 border-b border-sky-100" aria-label={ariaLabel}>
      <div className="-mb-px flex flex-wrap gap-x-6 gap-y-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`border-b-2 pb-3 text-sm transition-colors ${
                isActive
                  ? "border-[#0A6EBD] font-semibold text-[#0D1F2D]"
                  : "border-transparent text-[#7AAEC8] hover:text-[#2C4A5E]"
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
