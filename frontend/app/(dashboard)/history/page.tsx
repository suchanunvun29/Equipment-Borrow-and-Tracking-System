"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { api } from "@/lib/api";
import { formatThaiDate } from "@/lib/date";
import { getBorrowStatusMeta } from "@/lib/status";

interface HistoryRow {
  id: string;
  requestCode: string;
  borrower: string;
  equipmentName: string;
  borrowDate: string;
  expectedReturn?: string;
  status: string;
  notes?: string;
  approvedAt?: string;
  returnDate?: string;
  returnReason?: string;
  conditionNote?: string;
}

type SortField = "requestCode" | "borrower" | "equipmentName" | "borrowDate" | "expectedReturn" | "status";
type SortDirection = "asc" | "desc";

export default function HistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [selected, setSelected] = useState<HistoryRow | null>(null);
  const [sortField, setSortField] = useState<SortField>("borrowDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const mapReturnReason = (reason?: string) => {
    if (!reason) return "-";
    if (reason === "normal") return "ปกติ";
    if (reason === "resigned") return "ลาออก";
    if (reason === "broken") return "ชำรุด";
    if (reason === "other") return "อื่น ๆ";
    return reason;
  };

  useEffect(() => {
    api.borrow
      .list()
      .then((data) => setRows(data.filter((r: HistoryRow) => ["returned", "rejected"].includes(r.status))))
      .catch(() => setRows([]));
  }, []);

  const sortedRows = useMemo(() => {
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
  }, [rows, sortField, sortDirection]);

  const onSort = (columnIndex: number) => {
    const fields: SortField[] = ["requestCode", "borrower", "equipmentName", "borrowDate", "expectedReturn", "status"];
    const nextField = fields[columnIndex];
    if (!nextField) return;

    if (sortField === nextField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(nextField);
    setSortDirection(nextField === "borrowDate" || nextField === "expectedReturn" ? "desc" : "asc");
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
    <section>
      <h1 className="text-2xl font-bold text-primary-dark mb-4">ประวัติการยืม/คืน</h1>
      <Table
        columns={["รหัสคำขอ", "ผู้ยืม", "อุปกรณ์", "วันที่ยืม", "คืนคาดหวัง", "สถานะ", "จัดการ"]}
        rows={sortedRows.map((r) => [
          r.requestCode,
          r.borrower,
          r.equipmentName,
          formatThaiDate(r.borrowDate),
          r.expectedReturn ? formatThaiDate(r.expectedReturn) : "-",
          (() => {
            const statusMeta = getBorrowStatusMeta(r.status);
            return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>;
          })(),
          <button key={r.id} className="rounded bg-orange-100 px-2 py-1 text-orange-800" onClick={() => setSelected(r)}>
            ดูรายละเอียด
          </button>,
        ])}
        sortableColumns={[0, 1, 2, 3, 4, 5]}
        sortColumn={sortColumnMap[sortField]}
        sortDirection={sortDirection}
        onSort={onSort}
      />

      <Modal open={selected !== null} title="รายละเอียดประวัติการยืม/คืน" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">รหัสคำขอ:</span> {selected.requestCode}
            </p>
            <p>
              <span className="font-semibold">ผู้ยืม:</span> {selected.borrower}
            </p>
            <p>
              <span className="font-semibold">อุปกรณ์:</span> {selected.equipmentName}
            </p>
            <p>
              <span className="font-semibold">วันที่ยืม:</span> {formatThaiDate(selected.borrowDate)}
            </p>
            <p>
              <span className="font-semibold">คืนคาดหวัง:</span> {selected.expectedReturn ? formatThaiDate(selected.expectedReturn) : "-"}
            </p>
            <p>
              <span className="font-semibold">สถานะ:</span> {getBorrowStatusMeta(selected.status).label}
            </p>
            <p>
              <span className="font-semibold">วันที่อนุมัติ/ปฏิเสธ:</span> {selected.approvedAt ? formatThaiDate(selected.approvedAt) : "-"}
            </p>
            <p>
              <span className="font-semibold">วันที่คืน:</span> {selected.returnDate ? formatThaiDate(selected.returnDate) : "-"}
            </p>
            <p>
              <span className="font-semibold">เหตุผลการคืน:</span> {mapReturnReason(selected.returnReason)}
            </p>
            <p>
              <span className="font-semibold">หมายเหตุคำขอ:</span> {selected.notes || "-"}
            </p>
            <p>
              <span className="font-semibold">หมายเหตุสภาพอุปกรณ์:</span> {selected.conditionNote || "-"}
            </p>
          </div>
        )}
      </Modal>
    </section>
  );
}
