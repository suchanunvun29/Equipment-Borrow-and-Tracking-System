"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { api, type EquipmentCategoryPayload } from "@/lib/api";
import { formatThaiDate } from "@/lib/date";
import { appLogger } from "@/lib/logger";

interface EquipmentCategoryRow {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

type SortField = "name" | "description" | "createdAt";
type SortDirection = "asc" | "desc";

const initialForm: EquipmentCategoryPayload = {
  name: "",
  description: "",
};

export default function EquipmentCategoriesPage() {
  const [rows, setRows] = useState<EquipmentCategoryRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EquipmentCategoryPayload>(initialForm);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const loadData = async () => {
    try {
      const data = await api.equipmentCategory.list();
      setRows(data);
      appLogger.info("โหลดข้อมูลประเภทอุปกรณ์สำเร็จ", { count: data.length });
    } catch {
      setRows([]);
      appLogger.error("โหลดข้อมูลประเภทอุปกรณ์ไม่สำเร็จ");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sortedRows = useMemo(() => {
    const copied = [...rows];
    copied.sort((a, b) => {
      let compare = 0;

      switch (sortField) {
        case "name":
          compare = a.name.localeCompare(b.name, "th");
          break;
        case "description":
          compare = (a.description ?? "").localeCompare(b.description ?? "", "th");
          break;
        case "createdAt":
          compare = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortDirection === "asc" ? compare : -compare;
    });
    return copied;
  }, [rows, sortField, sortDirection]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setError(null);
    setOpen(true);
  };

  const openEditModal = (row: EquipmentCategoryRow) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      description: row.description ?? "",
    });
    setError(null);
    setOpen(true);
  };

  const closeModal = () => {
    if (loading) return;
    setOpen(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && editingId) {
        appLogger.info("เริ่มแก้ไขประเภทอุปกรณ์", { categoryId: editingId });
        await api.equipmentCategory.update(editingId, form);
        appLogger.info("แก้ไขประเภทอุปกรณ์สำเร็จ", { categoryId: editingId });
      } else {
        appLogger.info("เริ่มเพิ่มประเภทอุปกรณ์", { name: form.name });
        await api.equipmentCategory.create(form);
        appLogger.info("เพิ่มประเภทอุปกรณ์สำเร็จ", { name: form.name });
      }

      setOpen(false);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "บันทึกข้อมูลไม่สำเร็จ";
      appLogger.error("บันทึกข้อมูลประเภทอุปกรณ์ไม่สำเร็จ", { message });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    const confirmed = window.confirm("ยืนยันการลบประเภทอุปกรณ์?");
    if (!confirmed) return;

    try {
      appLogger.info("เริ่มลบประเภทอุปกรณ์", { categoryId: id });
      await api.equipmentCategory.delete(id);
      appLogger.info("ลบประเภทอุปกรณ์สำเร็จ", { categoryId: id });
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "ลบข้อมูลไม่สำเร็จ";
      appLogger.error("ลบประเภทอุปกรณ์ไม่สำเร็จ", { categoryId: id, message });
      alert(message);
    }
  };

  const onSort = (columnIndex: number) => {
    const fields: SortField[] = ["name", "description", "createdAt"];
    const nextField = fields[columnIndex];
    if (!nextField) return;

    if (sortField === nextField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(nextField);
    setSortDirection(nextField === "createdAt" ? "desc" : "asc");
  };

  const sortColumnMap: Record<SortField, number> = {
    name: 0,
    description: 1,
    createdAt: 2,
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-dark">ประเภทอุปกรณ์</h1>
        <button className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark" onClick={openCreateModal}>
          เพิ่มประเภทอุปกรณ์
        </button>
      </div>

      <Table
        columns={["ชื่อประเภท", "รายละเอียด", "วันที่สร้าง", "จัดการ"]}
        rows={sortedRows.map((r) => [
          r.name,
          r.description || "-",
          formatThaiDate(r.createdAt),
          <div key={r.id} className="flex gap-2">
            <button className="rounded bg-amber-100 px-2 py-1 text-amber-800" onClick={() => openEditModal(r)}>
              แก้ไข
            </button>
            <button className="rounded bg-red-100 px-2 py-1 text-red-700" onClick={() => onDelete(r.id)}>
              ลบ
            </button>
          </div>,
        ])}
        sortableColumns={[0, 1, 2]}
        sortColumn={sortColumnMap[sortField]}
        sortDirection={sortDirection}
        onSort={onSort}
      />

      <Modal open={open} title={isEditing ? "แก้ไขประเภทอุปกรณ์" : "เพิ่มประเภทอุปกรณ์"} onClose={closeModal}>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm">ชื่อประเภทอุปกรณ์</label>
            <input className="w-full rounded-lg border px-3 py-2" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div>
            <label className="mb-1 block text-sm">รายละเอียด</label>
            <textarea className="w-full rounded-lg border px-3 py-2" rows={3} value={form.description ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="rounded-lg border px-4 py-2" disabled={loading}>
              ยกเลิก
            </button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-white" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
