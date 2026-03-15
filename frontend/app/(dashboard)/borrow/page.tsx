"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { ThaiDatePicker } from "@/components/ui/ThaiDatePicker";
import { api } from "@/lib/api";
import { formatThaiDate, getTodayIsoDate } from "@/lib/date";
import { appLogger } from "@/lib/logger";
import { getBorrowStatusMeta } from "@/lib/status";

interface EquipmentItem {
  id: string;
  code: string;
  name: string;
}

interface BorrowItem {
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

export default function BorrowPage() {
  const [rows, setRows] = useState<BorrowItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ equipmentId: "", borrowDate: getTodayIsoDate(), expectedReturn: "", notes: "" });
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("borrowDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const load = async () => {
    try {
      const [borrowRows, eqRows] = await Promise.all([api.borrow.list(), api.equipment.list()]);
      setRows(borrowRows);
      setEquipment(eqRows);
      appLogger.info("โหลดข้อมูลหน้ายืมสำเร็จ", { borrowCount: borrowRows.length, equipmentCount: eqRows.length });
    } catch {
      setRows([]);
      setEquipment([]);
      appLogger.error("โหลดข้อมูลหน้ายืมไม่สำเร็จ");
    }
  };

  useEffect(() => {
    load();
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      appLogger.info("เริ่มสร้างคำขอยืม", { equipmentId: form.equipmentId });
      await api.borrow.create({
        equipmentId: form.equipmentId,
        borrowDate: form.borrowDate,
        expectedReturn: form.expectedReturn || undefined,
        notes: form.notes || undefined,
      });
      appLogger.info("สร้างคำขอยืมสำเร็จ", { equipmentId: form.equipmentId });
      setOpen(false);
      setForm({ equipmentId: "", borrowDate: getTodayIsoDate(), expectedReturn: "", notes: "" });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "สร้างคำขอยืมไม่สำเร็จ";
      appLogger.error("สร้างคำขอยืมไม่สำเร็จ", { equipmentId: form.equipmentId, message });
      setError(message);
    }
  };

  const approve = async (id: string) => {
    appLogger.info("เริ่มอนุมัติคำขอยืม", { borrowId: id });
    await api.borrow.approve(id);
    appLogger.info("อนุมัติคำขอยืมสำเร็จ", { borrowId: id });
    await load();
  };

  const reject = async (id: string) => {
    const note = window.prompt("ระบุเหตุผลการปฏิเสธ") ?? "";
    appLogger.info("เริ่มปฏิเสธคำขอยืม", { borrowId: id });
    await api.borrow.reject(id, note);
    appLogger.info("ปฏิเสธคำขอยืมสำเร็จ", { borrowId: id });
    await load();
  };

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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-primary-dark">การยืมอุปกรณ์</h1>
        <button className="bg-primary text-white px-4 py-2 rounded-lg" onClick={() => setOpen(true)}>
          สร้างคำขอยืม
        </button>
      </div>

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
          <div key={r.id} className="flex gap-2">
            {r.status === "pending" && (
              <>
                <button className="px-2 py-1 rounded bg-green-100 text-green-700" onClick={() => approve(r.id)}>
                  อนุมัติ
                </button>
                <button className="px-2 py-1 rounded bg-red-100 text-red-700" onClick={() => reject(r.id)}>
                  ปฏิเสธ
                </button>
              </>
            )}
          </div>,
        ])}
        sortableColumns={[0, 1, 2, 3, 4, 5]}
        sortColumn={sortColumnMap[sortField]}
        sortDirection={sortDirection}
        onSort={onSort}
      />

      <Modal open={open} title="สร้างคำขอยืม" onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={submit}>
          <select className="w-full border rounded-lg px-3 py-2" value={form.equipmentId} onChange={(e) => setForm({ ...form, equipmentId: e.target.value })} required>
            <option value="">เลือกอุปกรณ์</option>
            {equipment.map((e) => (
              <option key={e.id} value={e.id}>
                {e.code} - {e.name}
              </option>
            ))}
          </select>
          <ThaiDatePicker value={form.borrowDate} onChange={(value) => setForm({ ...form, borrowDate: value })} />
          <ThaiDatePicker value={form.expectedReturn} onChange={(value) => setForm({ ...form, expectedReturn: value })} placeholder="เลือกวันคืนคาดหวัง" />
          <textarea className="w-full border rounded-lg px-3 py-2" rows={3} placeholder="หมายเหตุ" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end">
            <button className="bg-primary text-white px-4 py-2 rounded-lg">บันทึก</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
