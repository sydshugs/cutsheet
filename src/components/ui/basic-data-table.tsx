"use client";

import * as React from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render: (val: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  searchable?: boolean;
  itemsPerPage?: number;
}

export function DataTable<T extends object>({
  data,
  columns,
  searchable = false,
  itemsPerPage = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(0);

  const filterableKeys = columns.filter((c) => c.filterable).map((c) => c.key);

  const filtered = React.useMemo(() => {
    if (!search.trim() || filterableKeys.length === 0) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      filterableKeys.some((key) => {
        const val = (row as Record<string, unknown>)[key];
        return String(val ?? "").toLowerCase().includes(q);
      })
    );
  }, [data, search, filterableKeys]);

  const sorted = React.useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey];
      const bv = (b as Record<string, unknown>)[sortKey];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const paginated = sorted.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  React.useEffect(() => {
    setPage(0);
  }, [search, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {searchable && (
        <input
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 280,
            padding: "8px 12px",
            fontSize: 13,
            fontFamily: "var(--mono)",
            background: "var(--surface-el)",
            border: "1px solid var(--border)",
            borderRadius: 7,
            color: "var(--ink)",
            outline: "none",
          }}
        />
      )}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                    background: "var(--surface-el)",
                    borderBottom: "1px solid var(--border)",
                    padding: "12px 16px",
                    textAlign: "left",
                    cursor: col.sortable ? "pointer" : "default",
                    userSelect: "none",
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid var(--border)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-el)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    style={{
                      padding: "14px 16px",
                      background: "transparent",
                    }}
                  >
                    {col.render(
                      (row as Record<string, unknown>)[col.key],
                      row
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontFamily: "var(--sans)",
            color: "var(--ink-muted)",
          }}
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--ink-muted)",
              cursor: page === 0 ? "not-allowed" : "pointer",
              opacity: page === 0 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--ink-muted)",
              cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
              opacity: page >= totalPages - 1 ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
