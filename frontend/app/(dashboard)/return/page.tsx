"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { ThaiDatePicker } from "@/components/ui/ThaiDatePicker";
import { api } from "@/lib/api";
import { formatThaiDate, getTodayIsoDate } from "@/lib/date";
import { appLogger } from "@/lib/logger";
import { getBorrowStatusMeta } from "@/lib/status";

interface ReturnRow {
  id: string;
  requestCode: string;
  borrowerId: string;
  borrower: string;
  equipmentName: string;
  borrowDate: string;
  expectedReturn?: string;
  status: string;
}

interface EmployeeRow {
  id: string;
  fullName: string;
  employeeCode?: string;
}

type SortField = "requestCode" | "borrower" | "equipmentName" | "borrowDate" | "expectedReturn" | "status";
type SortDirection = "asc" | "desc";

function sortReturnRows(rows: ReturnRow[], sortField: SortField, sortDirection: SortDirection) {
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

export default function ReturnPage() {
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({ returnDate: getTodayIsoDate(), returnReason: "normal", conditionNote: "" });

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [outstandingRows, setOutstandingRows] = useState<ReturnRow[]>([]);
  const [resignedDate, setResignedDate] = useState(getTodayIsoDate());
  const [resignedNote, setResignedNote] = useState("");
  const [mainSortField, setMainSortField] = useState<SortField>("borrowDate");
  const [mainSortDirection, setMainSortDirection] = useState<SortDirection>("desc");
  const [outSortField, setOutSortField] = useState<SortField>("borrowDate");
  const [outSortDirection, setOutSortDirection] = useState<SortDirection>("desc");

  const load = async () => {
    try {
      const [data, employeeRows] = await Promise.all([api.return.list(), api.employees.list()]);
      setRows(data);
      setEmployees(employeeRows);
      appLogger.info("โหลดข้อมูลหน้าคืนสำเร็จ", { count: data.length, employeeCount: employeeRows.length });
    } catch {
      setRows([]);
      setEmployees([]);
      appLogger.error("โหลดข้อมูลหน้าคืนไม่สำเร็จ");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sortedRows = useMemo(() => sortReturnRows(rows, mainSortField, mainSortDirection), [rows, mainSortField, mainSortDirection]);
  const sortedOutstandingRows = useMemo(
    () => sortReturnRows(outstandingRows, outSortField, outSortDirection),
    [outstandingRows, outSortField, outSortDirection],
  );

  const openModal = (id: string) => {
    setSelectedId(id);
    setForm({ returnDate: getTodayIsoDate(), returnReason: "normal", conditionNote: "" });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    appLogger.info("เริ่มบันทึกคืนอุปกรณ์", { borrowId: selectedId, reason: form.returnReason });
    await api.return.process({
      borrowId: selectedId,
      returnDate: form.returnDate,
      returnReason: form.returnReason as "normal" | "resigned" | "broken" | "other",
      conditionNote: form.conditionNote || undefined,
    });
    appLogger.info("บันทึกคืนอุปกรณ์สำเร็จ", { borrowId: selectedId });
    setOpen(false);
    await load();
  };

  const loadOutstanding = async () => {
    if (!selectedEmployeeId) {
      setOutstandingRows([]);
      return;
    }

    try {
      const data = await api.return.outstandingByEmployee(selectedEmployeeId);
      setOutstandingRows(data);
      appLogger.info("โหลดรายการค้างคืนพนักงานสำเร็จ", { employeeId: selectedEmployeeId, count: data.length });
    } catch {
      setOutstandingRows([]);
      appLogger.error("โหลดรายการค้างคืนพนักงานไม่สำเร็จ", { employeeId: selectedEmployeeId });
    }
  };

  const submitResigned = async () => {
    if (!selectedEmployeeId || !resignedDate) {
      alert("กรุณาเลือกพนักงานและวันที่คืน");
      return;
    }

    appLogger.info("เริ่มคืนแบบลาออก", { employeeId: selectedEmployeeId });
    await api.return.processResigned(selectedEmployeeId, {
      returnDate: resignedDate,
      conditionNote: resignedNote || undefined,
    });
    appLogger.info("คืนแบบลาออกสำเร็จ", { employeeId: selectedEmployeeId });

    setOutstandingRows([]);
    setResignedDate(getTodayIsoDate());
    setResignedNote("");
    await load();
  };

  const onSortMain = (columnIndex: number) => {
    const fields: SortField[] = ["requestCode", "borrower", "equipmentName", "borrowDate", "expectedReturn", "status"];
    const nextField = fields[columnIndex];
    if (!nextField) return;

    if (mainSortField === nextField) {
      setMainSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setMainSortField(nextField);
    setMainSortDirection(nextField === "borrowDate" || nextField === "expectedReturn" ? "desc" : "asc");
  };

  const onSortOutstanding = (columnIndex: number) => {
    const fields: SortField[] = ["requestCode", "borrower", "equipmentName", "borrowDate", "expectedReturn", "status"];
    const nextField = fields[columnIndex];
    if (!nextField) return;

    if (outSortField === nextField) {
      setOutSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setOutSortField(nextField);
    setOutSortDirection(nextField === "borrowDate" || nextField === "expectedReturn" ? "desc" : "asc");
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
      <div>
        <h1 className="text-2xl font-bold text-primary-dark mb-4">การคืนอุปกรณ์</h1>
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
            <button key={r.id} className="px-2 py-1 rounded bg-amber-100 text-amber-800" onClick={() => openModal(r.id)}>
              บันทึกคืน
            </button>,
          ])}
          sortableColumns={[0, 1, 2, 3, 4, 5]}
          sortColumn={sortColumnMap[mainSortField]}
          sortDirection={mainSortDirection}
          onSort={onSortMain}
        />
      </div>

      <div className="bg-white border border-orange-100 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-semibold text-primary-dark">คืนอุปกรณ์กรณีพนักงานลาออก</h2>

        <div className="grid md:grid-cols-3 gap-2">
          <select className="border rounded-lg px-3 py-2" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
            <option value="">เลือกพนักงาน</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
              </option>
            ))}
          </select>
          <button className="bg-orange-100 text-orange-800 rounded-lg px-3 py-2" onClick={loadOutstanding}>
            ตรวจรายการค้าง
          </button>
        </div>

        <Table
          columns={["รหัสคำขอ", "ผู้ยืม", "อุปกรณ์", "วันที่ยืม", "คืนคาดหวัง", "สถานะ"]}
          rows={sortedOutstandingRows.map((r) => [
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
          sortColumn={sortColumnMap[outSortField]}
          sortDirection={outSortDirection}
          onSort={onSortOutstanding}
        />

        <div className="grid md:grid-cols-3 gap-2 items-start">
          <ThaiDatePicker value={resignedDate} onChange={setResignedDate} />
          <input className="border rounded-lg px-3 py-2" placeholder="หมายเหตุ" value={resignedNote} onChange={(e) => setResignedNote(e.target.value)} />
          <button className="bg-primary text-white rounded-lg px-3 py-2" onClick={submitResigned}>
            ยืนยันคืนทั้งหมด (ลาออก)
          </button>
        </div>
      </div>

      <Modal open={open} title="บันทึกการคืนอุปกรณ์" onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={submit}>
          <ThaiDatePicker value={form.returnDate} onChange={(value) => setForm({ ...form, returnDate: value })} />
          <select className="w-full border rounded-lg px-3 py-2" value={form.returnReason} onChange={(e) => setForm({ ...form, returnReason: e.target.value })}>
            <option value="normal">ปกติ</option>
            <option value="resigned">ลาออก</option>
            <option value="broken">พัง</option>
            <option value="other">อื่น ๆ</option>
          </select>
          <textarea className="w-full border rounded-lg px-3 py-2" rows={3} placeholder="หมายเหตุสภาพอุปกรณ์" value={form.conditionNote} onChange={(e) => setForm({ ...form, conditionNote: e.target.value })} />
          <div className="flex justify-end">
            <button className="bg-primary text-white px-4 py-2 rounded-lg">บันทึก</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
