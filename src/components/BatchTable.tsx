import { DataTable } from "./ui/basic-data-table";

interface BatchResult {
  id: number;
  rank: number;
  filename: string;
  hook: number;
  clarity: number;
  cta: number;
  retention: number;
  overall: number;
  wouldScale: boolean;
}

function scoreColor(val: number): string {
  if (val >= 9) return "var(--success)";
  if (val >= 7) return "var(--accent)";
  if (val >= 5) return "#F59E0B";
  if (val >= 3) return "#F97316";
  return "var(--error)";
}

function RankBadge({ rank }: { rank: number }) {
  const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
  if (medals[rank]) {
    return (
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 13,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {medals[rank]}
        <span style={{ color: "var(--ink-muted)", fontSize: 11 }}>#{rank}</span>
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: "var(--mono)",
        fontSize: 12,
        color: "var(--ink-faint)",
      }}
    >
      #{rank}
    </span>
  );
}

function ScoreCell({ value }: { value: number }) {
  return (
    <span
      style={{
        fontFamily: "var(--mono)",
        fontSize: 13,
        fontWeight: 600,
        color: scoreColor(value),
      }}
    >
      {value}
    </span>
  );
}

function ScaleCell({ value }: { value: boolean }) {
  return (
    <span
      style={{
        fontFamily: "var(--mono)",
        fontSize: 12,
        fontWeight: 600,
        color: value ? "var(--success)" : "var(--error)",
      }}
    >
      {value ? "✓ Yes" : "✗ No"}
    </span>
  );
}

function FilenameCell({
  value,
  isWinner,
}: {
  value: string;
  isWinner: boolean;
}) {
  return (
    <span
      style={{
        fontFamily: "var(--mono)",
        fontSize: 12,
        color: isWinner ? "var(--ink)" : "var(--ink-muted)",
        fontWeight: isWinner ? 600 : 400,
      }}
    >
      {value}
    </span>
  );
}

interface BatchTableProps {
  results: BatchResult[];
}

export function BatchTable({ results }: BatchTableProps) {
  const sorted = [...results].sort((a, b) => a.rank - b.rank);

  const columns = [
    {
      key: "rank" as const,
      header: "Rank",
      sortable: true,
      render: (val: number) => <RankBadge rank={val} />,
    },
    {
      key: "filename" as const,
      header: "File",
      sortable: true,
      filterable: true,
      render: (val: string, row: BatchResult) => (
        <FilenameCell value={val} isWinner={row.rank === 1} />
      ),
    },
    {
      key: "hook" as const,
      header: "Hook",
      sortable: true,
      render: (val: number) => <ScoreCell value={val} />,
    },
    {
      key: "clarity" as const,
      header: "Clarity",
      sortable: true,
      render: (val: number) => <ScoreCell value={val} />,
    },
    {
      key: "cta" as const,
      header: "CTA",
      sortable: true,
      render: (val: number) => <ScoreCell value={val} />,
    },
    {
      key: "retention" as const,
      header: "Retention",
      sortable: true,
      render: (val: number) => <ScoreCell value={val} />,
    },
    {
      key: "overall" as const,
      header: "Overall",
      sortable: true,
      render: (val: number) => (
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 14,
            fontWeight: 700,
            background: "var(--grad)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: "wouldScale" as const,
      header: "Would Scale",
      sortable: true,
      render: (val: boolean) => <ScaleCell value={val} />,
    },
  ];

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg, 14px)",
        overflow: "hidden",
      }}
    >
      <style>{`
        .batch-table-wrap tbody tr:first-child td:first-child {
          border-left: 3px solid var(--success);
        }
        .batch-table-wrap thead th {
          font-family: var(--mono) !important;
          font-size: 10px !important;
          letter-spacing: 0.1em !important;
          text-transform: uppercase !important;
          color: rgba(255,255,255,0.25) !important;
          background: var(--surface-el) !important;
          border-bottom: 1px solid var(--border) !important;
          padding: 12px 16px !important;
        }
        .batch-table-wrap tbody tr {
          border-bottom: 1px solid var(--border) !important;
          transition: background 0.15s !important;
        }
        .batch-table-wrap tbody tr:hover {
          background: var(--surface-el) !important;
        }
        .batch-table-wrap tbody td {
          padding: 14px 16px !important;
          background: transparent !important;
        }
        .batch-table-wrap input[type="search"],
        .batch-table-wrap input[type="text"] {
          background: var(--surface-el) !important;
          border: 1px solid var(--border) !important;
          color: var(--ink) !important;
          border-radius: 7px !important;
          font-family: var(--mono) !important;
          font-size: 12px !important;
        }
        .batch-table-wrap button {
          font-family: var(--sans) !important;
          color: var(--ink-muted) !important;
          border-color: var(--border) !important;
        }
      `}</style>

      <div className="batch-table-wrap">
        <DataTable
          data={sorted}
          columns={columns}
          searchable
          itemsPerPage={10}
        />
      </div>
    </div>
  );
}
