"use client"

export function GuestPerformanceLegacyViewToggle({
  performancesView,
  setPerformancesViewMode,
}: {
  performancesView: "timeline" | "table"
  setPerformancesViewMode: (mode: "timeline" | "table") => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-pressed={performancesView === "timeline"}
        onClick={() => setPerformancesViewMode("timeline")}
        className={`p-1.5 rounded transition-colors ${
          performancesView === "timeline"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
        aria-label="Timeline view"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M9 3v18" />
          <path d="M15 3v18" />
        </svg>
      </button>
      <button
        type="button"
        aria-pressed={performancesView === "table"}
        onClick={() => setPerformancesViewMode("table")}
        className={`p-1.5 rounded transition-colors ${
          performancesView === "table"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
        aria-label="Table view"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M3 15h18" />
        </svg>
      </button>
    </div>
  )
}
