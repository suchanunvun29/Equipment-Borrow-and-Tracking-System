"use client";

import { useEffect, useMemo, useState } from "react";
import { Table } from "@/components/ui/Table";
import { ThaiDatePicker } from "@/components/ui/ThaiDatePicker";
import { api } from "@/lib/api";
import { formatThaiDate, getTodayIsoDate } from "@/lib/date";
import { appLogger } from "@/lib/logger";
import { getBorrowStatusMeta } from "@/lib/status";

interface ReportRow {
  id: string;
  requestCode: string;
  borrower: string;
  equipmentName: string;
  borrowDate: string;
  expectedReturn?: string;
  status: string;
}

type SortField = "requestCode" | "borrower" | "equipmentName" | "borrowDate" | "expectedReturn" | "status";
type SortDirection = "asc" | "desc";

function sortReportRows(rows: ReportRow[], sortField: SortField, sortDirection: SortDirection) {
  const copied = [...rows];
  copied.sort((a, b) => {
    let compare = 0;

    switch (sortField) {
      case "requestCode":
        compare = a.requestCode.localeCompare(b.requestCode, "th");
        break;
      case "borrower":
        compare = a.borrower.localeCompare(b.borrower, "th");
        break;
      case "equipmentName":
        compare = a.equipmentName.localeCompare(b.equipmentName, "th");
        break;
      case "borrowDate":
        compare = new Date(a.borrowDate).getTime() - new Date(b.borrowDate).getTime();
        break;
      case "expectedReturn":
        compare = new Date(a.expectedReturn ?? "1970-01-01").getTime() - new Date(b.expectedReturn ?? "1970-01-01").getTime();
        break;
      case "status":
        compare = getBorrowStatusMeta(a.status).label.localeCompare(getBorrowStatusMeta(b.status).label, "th");
        break;
    }

    return sortDirection === "asc" ? compare : -compare;
  });
  return copied;
}

export default function ReportsPage() {
  const [from, setFrom] = useState(getTodayIsoDate);
  const [to, setTo] = useState(getTodayIsoDate);
  const [periodRows, setPeriodRows] = useState<ReportRow[]>([]);
  const [overdueRows, setOverdueRows] = useState<ReportRow[]>([]);
  const [periodSortField, setPeriodSortField] = useState<SortField>("borrowDate");
  const [periodSortDirection, setPeriodSortDirection] = useState<SortDirection>("desc");
  const [overdueSortField, setOverdueSortField] = useState<SortField>("borrowDate");
  const [overdueSortDirection, setOverdueSortDirection] = useState<SortDirection>("desc");

  const loadOverdue = async () => {
    try {
      const data = await api.reports.overdue();
      setOverdueRows(data);
      appLogger.info("โหลดรายงานเกินกำหนดสำเร็จ", { count: data.length });
    } catch {
      setOverdueRows([]);
      appLogger.error("โหลดรายงานเกินกำหนดไม่สำเร็จ");
    }
  };

  useEffect(() => {
    loadOverdue();
  }, []);

  const searchPeriod = async () => {
    if (!from || !to) return;
    appLogger.info("ค้นหารายงานตามช่วงเวลา", { from, to });
    const data = await api.reports.byPeriod(from, to);
    appLogger.info("ค้นหารายงานตามช่วงเวลาสำเร็จ", { count: data.length });
    setPeriodRows(data);
  };

  const sortedPeriodRows = useMemo(
    () => sortReportRows(periodRows, periodSortField, periodSortDirection),
    [periodRows, periodSortField, periodSortDirection],
  );
  const sortedOverdueRows = useMemo(
    () => sortReportRows(overdueRows, overdueSortField, overdueSortDirection),
    [overdueRows, overdueSortField, overdueSortDirection],
  );

  const onSortPeriod = (columnIndex: number) => {
    const fields: SortField[] = ["requestCode", "borrower", "equipmentName", "borrowDate", "expectedReturn", "status"];
    const nextField = fields[columnIndex];
    if (!nextField) return;

    if (periodSortField === nextField) {
      setPeriodSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setPeriodSortField(nextField);
    setPeriodSortDirection(nextField === "borrowDate" || nextField === "expectedReturn" ? "desc" : "asc");
  };

  const onSortOverdue = (columnIndex: number) => {
    const fields: SortField[] = ["requestCode", "borrower", "equipmentName", "borrowDate", "expectedReturn", "status"];
    const nextField = fields[columnIndex];
    if (!nextField) return;

    if (overdueSortField === nextField) {
      setOverdueSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setOverdueSortField(nextField);
    setOverdueSortDirection(nextField === "borrowDate" || nextField === "expectedReturn" ? "desc" : "asc");
  };

  const sortColumnMap: Record<SortField, number> = {
    requestCode: 0,
    borrower: 1,
    equipmentName: 2,
    borrowDate: 3,
    expectedReturn: 4,
    status: 5,
  };

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-primary-dark">รายงาน</h1>

      <div className="bg-white border border-orange-100 rounded-xl p-4">
        <h2 className="font-semibold mb-3">รายงานตามช่วงเวลา</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <ThaiDatePicker value={from} onChange={setFrom} className="min-w-56" />
          <ThaiDatePicker value={to} onChange={setTo} className="min-w-56" />
          <button className="bg-primary text-white px-4 rounded" onClick={searchPeriod}>
            ค้นหา
          </button>
        </div>
        <p className="mb-3 text-sm text-slate-600">
          ช่วงวันที่: {formatThaiDate(from)} - {formatThaiDate(to)}
        </p>
        <Table
          columns={["รหัสคำขอ", "ผู้ยืม", "อุปกรณ์", "วันที่ยืม", "คืนคาดหวัง", "สถานะ"]}
          rows={sortedPeriodRows.map((r) => [
            r.requestCode,
            r.borrower,
            r.equipmentName,
            formatThaiDate(r.borrowDate),
            r.expectedReturn ? formatThaiDate(r.expectedReturn) : "-",
            (() => {
              const statusMeta = getBorrowStatusMeta(r.status);
              return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>;
            })(),
          ])}
          sortableColumns={[0, 1, 2, 3, 4, 5]}
          sortColumn={sortColumnMap[periodSortField]}
          sortDirection={periodSortDirection}
          onSort={onSortPeriod}
        />
      </div>

      <div className="bg-white border border-orange-100 rounded-xl p-4">
        <h2 className="font-semibold mb-3">รายงานเกินกำหนด</h2>
        <Table
          columns={["รหัสคำขอ", "ผู้ยืม", "อุปกรณ์", "วันที่ยืม", "คืนคาดหวัง", "สถานะ"]}
          rows={sortedOverdueRows.map((r) => [
            r.requestCode,
            r.borrower,
            r.equipmentName,
            formatThaiDate(r.borrowDate),
            r.expectedReturn ? formatThaiDate(r.expectedReturn) : "-",
            (() => {
              const statusMeta = getBorrowStatusMeta(r.status);
              return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>;
            })(),
          ])}
          sortableColumns={[0, 1, 2, 3, 4, 5]}
          sortColumn={sortColumnMap[overdueSortField]}
          sortDirection={overdueSortDirection}
          onSort={onSortOverdue}
        />
      </div>
    </section>
  );
}
