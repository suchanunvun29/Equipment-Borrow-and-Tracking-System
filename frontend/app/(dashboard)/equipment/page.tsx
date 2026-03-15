"use client";

import { useEffect, useMemo, useState } from "react";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { api, type EquipmentPayload } from "@/lib/api";
import { appLogger } from "@/lib/logger";
import { getEquipmentStatusMeta } from "@/lib/status";

interface EquipmentRow {
  id: string;
  code: string;
  name: string;
  model?: string;
  categoryId?: string;
  categoryName?: string;
  totalQuantity: number;
  availableQty: number;
  status: string;
  description?: string;
}

interface EquipmentCategoryRow {
  id: string;
  name: string;
}

type SortField = "code" | "name" | "categoryName" | "totalQuantity" | "availableQty" | "status";
type SortDirection = "asc" | "desc";

const initialForm: EquipmentPayload = {
  code: "",
  name: "",
  model: "",
  categoryId: "",
  totalQuantity: 1,
  availableQty: 1,
  description: "",
};

export default function EquipmentPage() {
  const [rows, setRows] = useState<EquipmentRow[]>([]);
  const [categories, setCategories] = useState<EquipmentCategoryRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EquipmentPayload>(initialForm);
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const loadData = async () => {
    try {
      const [equipmentRows, categoryRows] = await Promise.all([api.equipment.list(), api.equipmentCategory.list()]);
      setRows(equipmentRows);
      setCategories(categoryRows);
      appLogger.info("โหลดข้อมูลอุปกรณ์สำเร็จ", { count: equipmentRows.length, categoryCount: categoryRows.length });
    } catch {
      setRows([]);
      setCategories([]);
      appLogger.error("โหลดข้อมูลอุปกรณ์ไม่สำเร็จ");
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
        case "code":
          compare = a.code.localeCompare(b.code, "th");
          break;
        case "name":
          compare = a.name.localeCompare(b.name, "th");
          break;
        case "categoryName":
          compare = (a.categoryName ?? "").localeCompare(b.categoryName ?? "", "th");
          break;
        case "totalQuantity":
          compare = a.totalQuantity - b.totalQuantity;
          break;
        case "availableQty":
          compare = a.availableQty - b.availableQty;
          break;
        case "status":
          compare = getEquipmentStatusMeta(a.status).label.localeCompare(getEquipmentStatusMeta(b.status).label, "th");
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

  const openEditModal = (row: EquipmentRow) => {
    setEditingId(row.id);
    setForm({
      code: row.code,
      name: row.name,
      model: row.model ?? "",
      categoryId: row.categoryId ?? "",
      totalQuantity: row.totalQuantity,
      availableQty: row.availableQty,
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
        appLogger.info("เริ่มแก้ไขอุปกรณ์", { equipmentId: editingId });
        await api.equipment.update(editingId, form);
        appLogger.info("แก้ไขอุปกรณ์สำเร็จ", { equipmentId: editingId });
      } else {
        appLogger.info("เริ่มเพิ่มอุปกรณ์", { code: form.code });
        await api.equipment.create(form);
        appLogger.info("เพิ่มอุปกรณ์สำเร็จ", { code: form.code });
      }

      setOpen(false);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "บันทึกข้อมูลไม่สำเร็จ";
      appLogger.error("บันทึกข้อมูลอุปกรณ์ไม่สำเร็จ", { message });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    const confirmed = window.confirm("ยืนยันการลบข้อมูลอุปกรณ์?");
    if (!confirmed) return;

    try {
      appLogger.info("เริ่มลบอุปกรณ์", { equipmentId: id });
      await api.equipment.delete(id);
      appLogger.info("ลบอุปกรณ์สำเร็จ", { equipmentId: id });
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "ลบข้อมูลไม่สำเร็จ";
      appLogger.error("ลบอุปกรณ์ไม่สำเร็จ", { equipmentId: id, message });
      alert(message);
    }
  };

  const onSort = (columnIndex: number) => {
    const fields: SortField[] = ["code", "name", "categoryName", "totalQuantity", "availableQty", "status"];
    const nextField = fields[columnIndex];
    if (!nextField) return;

    if (sortField === nextField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(nextField);
    setSortDirection(nextField === "totalQuantity" || nextField === "availableQty" ? "desc" : "asc");
  };

  const sortColumnMap: Record<SortField, number> = {
    code: 0,
    name: 1,
    categoryName: 2,
    totalQuantity: 3,
    availableQty: 4,
    status: 5,
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-primary-dark">อุปกรณ์</h1>
        <button onClick={openCreateModal} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg">
          เพิ่มอุปกรณ์
        </button>
      </div>

      <Table
        columns={["รหัส", "ชื่อ", "ประเภท", "จำนวนทั้งหมด", "คงเหลือ", "สถานะ", "จัดการ"]}
        rows={sortedRows.map((r) => [
          r.code,
          r.name,
          r.categoryName ?? "-",
          String(r.totalQuantity),
          String(r.availableQty),
          (() => {
            const statusMeta = getEquipmentStatusMeta(r.status);
            return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>;
          })(),
          <div key={r.id} className="flex gap-2">
            <button className="px-2 py-1 rounded bg-amber-100 text-amber-800" onClick={() => openEditModal(r)}>
              แก้ไข
            </button>
            <button className="px-2 py-1 rounded bg-red-100 text-red-700" onClick={() => onDelete(r.id)}>
              ลบ
            </button>
          </div>,
        ])}
        sortableColumns={[0, 1, 2, 3, 4, 5]}
        sortColumn={sortColumnMap[sortField]}
        sortDirection={sortDirection}
        onSort={onSort}
      />

      <Modal open={open} title={isEditing ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์"} onClose={closeModal}>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm mb-1">รหัสอุปกรณ์</label>
            <input className="w-full border rounded-lg px-3 py-2" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm mb-1">ชื่ออุปกรณ์</label>
            <input className="w-full border rounded-lg px-3 py-2" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm mb-1">ประเภทอุปกรณ์</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.categoryId ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))} required>
              <option value="">เลือกประเภทอุปกรณ์</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">รุ่น</label>
            <input className="w-full border rounded-lg px-3 py-2" value={form.model ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">จำนวนทั้งหมด</label>
              <input type="number" min={1} className="w-full border rounded-lg px-3 py-2" value={form.totalQuantity} onChange={(e) => setForm((prev) => ({ ...prev, totalQuantity: Number(e.target.value) }))} required />
            </div>
            <div>
              <label className="block text-sm mb-1">จำนวนคงเหลือ</label>
              <input type="number" min={0} className="w-full border rounded-lg px-3 py-2" value={form.availableQty} onChange={(e) => setForm((prev) => ({ ...prev, availableQty: Number(e.target.value) }))} required />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">รายละเอียด</label>
            <textarea className="w-full border rounded-lg px-3 py-2" rows={3} value={form.description ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border" disabled={loading}>
              ยกเลิก
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
