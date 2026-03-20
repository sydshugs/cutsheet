// DeepDiveTabGroup — pill tab row inside SlideSheet header
// Ghost pill style matching DESIGN-SPEC.md Section 8

export interface Tab {
  id: string;
  label: string;
}

interface DeepDiveTabGroupProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function DeepDiveTabGroup({
  tabs,
  activeTab,
  onTabChange,
}: DeepDiveTabGroupProps) {
  return (
    <div
      role="tablist"
      aria-label="Deep dive sections"
      style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        whiteSpace: "nowrap",
        padding: "0 0 12px",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: "6px 12px",
              fontSize: 11,
              borderRadius: 6,
              border: `1px solid ${
                isActive ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)"
              }`,
              background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
              color: isActive ? "#818cf8" : "#52525b",
              fontWeight: isActive ? 600 : 500,
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 150ms ease",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
