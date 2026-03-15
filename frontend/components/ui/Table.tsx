import type { ReactNode } from "react";

type SortDirection = "asc" | "desc";

export function Table({
  columns,
  rows,
  sortableColumns = [],
  sortColumn,
  sortDirection = "asc",
  onSort,
}: {
  columns: ReactNode[];
  rows: ReactNode[][];
  sortableColumns?: number[];
  sortColumn?: number;
  sortDirection?: SortDirection;
  onSort?: (index: number) => void;
}) {
  const sortableSet = new Set(sortableColumns);

  const renderSortIcon = (index: number) => {
    if (!sortableSet.has(index)) return null;
    if (sortColumn !== index) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <div className="bg-white rounded-xl border border-orange-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-orange-50 text-primary-dark">
          <tr>
            {columns.map((col, index) => (
              <th key={`col-${index}`} className="text-left px-4 py-3 font-semibold">
                {sortableSet.has(index) && onSort ? (
                  <button type="button" className="inline-flex items-center gap-1" onClick={() => onSort(index)}>
                    {col}
                    <span>{renderSortIcon(index)}</span>
                  </button>
                ) : (
                  col
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-4 text-slate-500" colSpan={columns.length}>
                ไม่พบข้อมูล
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
