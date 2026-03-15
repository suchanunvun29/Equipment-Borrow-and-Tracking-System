"use client";

import { useEffect, useMemo, useState } from "react";
import { api, type SystemUsageLogRow } from "@/lib/api";
import { formatThaiDateTime } from "@/lib/date";
import { appLogger } from "@/lib/logger";

type StatusFilter = "all" | "success" | "clientError" | "serverError";
type SortField = "createdAt" | "username" | "action" | "method" | "statusCode" | "durationMs";
type SortDirection = "asc" | "desc";

function getActionLabel(method: string, path: string) {
  const m = method.toUpperCase();
  const p = path.toLowerCase();

  if (m === "POST" && p === "/api/auth/login") return "เข้าสู่ระบบ";
  if (m === "POST" && p === "/api/auth/register") return "ลงทะเบียนผู้ใช้";

  if (p.startsWith("/api/equipmentcategory")) {
    if (m === "GET") return "ดูประเภทอุปกรณ์";
    if (m === "POST") return "เพิ่มประเภทอุปกรณ์";
    if (m === "PUT") return "แก้ไขประเภทอุปกรณ์";
    if (m === "DELETE") return "ลบประเภทอุปกรณ์";
  }

  if (p.startsWith("/api/equipment")) {
    if (m === "GET") return "ดูข้อมูลอุปกรณ์";
    if (m === "POST") return "เพิ่มอุปกรณ์";
    if (m === "PUT") return "แก้ไขอุปกรณ์";
    if (m === "DELETE") return "ลบอุปกรณ์";
  }

  if (p.startsWith("/api/borrow")) {
    if (m === "GET") return "ดูคำขอยืม";
    if (m === "POST" && p.endsWith("/approve")) return "อนุมัติคำขอยืม";
    if (m === "POST" && p.endsWith("/reject")) return "ปฏิเสธคำขอยืม";
    if (m === "POST") return "สร้างคำขอยืม";
  }

  if (p.startsWith("/api/return")) {
    if (m === "GET") return "ดูข้อมูลการคืน";
    if (m === "POST" && p.includes("/resigned/")) return "คืนอุปกรณ์กรณีลาออก";
    if (m === "POST") return "บันทึกคืนอุปกรณ์";
  }

  if (p.startsWith("/api/reports")) return "ดูรายงาน";
  if (p.startsWith("/api/employee")) return "ดูข้อมูลพนักงาน";
  if (p.startsWith("/api/systemusagelog")) return "ดูประวัติการใช้งานระบบ";

  return `เรียกใช้งาน ${m}`;
}

function getMethodClassName(method: string) {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-sky-100 text-sky-900 border border-sky-300";
    case "POST":
      return "bg-emerald-100 text-emerald-900 border border-emerald-300";
    case "PUT":
      return "bg-amber-100 text-amber-900 border border-amber-300";
    case "DELETE":
      return "bg-rose-100 text-rose-900 border border-rose-300";
    default:
      return "bg-slate-100 text-slate-900 border border-slate-300";
  }
}

function getStatusClassName(statusCode: number) {
  if (statusCode >= 200 && statusCode < 300) {
    return "bg-emerald-100 text-emerald-900 border border-emerald-300";
  }
  if (statusCode >= 400 && statusCode < 500) {
    return "bg-amber-100 text-amber-900 border border-amber-300";
  }
  if (statusCode >= 500) {
    return "bg-rose-100 text-rose-900 border border-rose-300";
  }
  return "bg-slate-100 text-slate-900 border border-slate-300";
}

function toStatusGroup(statusCode: number): StatusFilter {
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 400 && statusCode < 500) return "clientError";
  if (statusCode >= 500) return "serverError";
  return "all";
}

export default function SystemUsagePage() {
  const [rows, setRows] = useState<SystemUsageLogRow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.systemUsage
      .list(300)
      .then((data) => {
        setRows(data);
        appLogger.info("โหลดประวัติการใช้งานระบบสำเร็จ", { count: data.length });
      })
      .catch(() => {
        setRows([]);
        appLogger.error("โหลดประวัติการใช้งานระบบไม่สำเร็จ");
      });
  }, []);

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(rows.map((r) => r.role).filter(Boolean)));
    return ["all", ...roles];
  }, [rows]);

  const methodOptions = useMemo(() => {
    const methods = Array.from(new Set(rows.map((r) => r.method.toUpperCase())));
    return ["all", ...methods];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return rows.filter((r) => {
      if (roleFilter !== "all" && r.role !== roleFilter) return false;
      if (methodFilter !== "all" && r.method.toUpperCase() !== methodFilter) return false;
      if (statusFilter !== "all" && toStatusGroup(r.statusCode) !== statusFilter) return false;

      if (!q) return true;

      const action = getActionLabel(r.method, r.path).toLowerCase();
      const hay = `${r.username} ${r.role} ${r.path} ${r.method} ${r.detail ?? ""} ${action}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, keyword, roleFilter, methodFilter, statusFilter]);

  const summary = useMemo(() => {
    const total = filteredRows.length;
    const success = filteredRows.filter((r) => r.statusCode >= 200 && r.statusCode < 300).length;
    const clientError = filteredRows.filter((r) => r.statusCode >= 400 && r.statusCode < 500).length;
    const serverError = filteredRows.filter((r) => r.statusCode >= 500).length;
    const avgDuration = total > 0
      ? Math.round(filteredRows.reduce((sum, r) => sum + r.durationMs, 0) / total)
      : 0;

    return { total, success, clientError, serverError, avgDuration };
  }, [filteredRows]);

  const sortedRows = useMemo(() => {
    const copied = [...filteredRows];
    copied.sort((a, b) => {
      let compare = 0;

      switch (sortField) {
        case "createdAt":
          compare = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "username":
          compare = a.username.localeCompare(b.username, "th");
          break;
        case "action":
          compare = getActionLabel(a.method, a.path).localeCompare(getActionLabel(b.method, b.path), "th");
          break;
        case "method":
          compare = a.method.localeCompare(b.method, "en");
          break;
        case "statusCode":
          compare = a.statusCode - b.statusCode;
          break;
        case "durationMs":
          compare = a.durationMs - b.durationMs;
          break;
      }

      return sortDirection === "asc" ? compare : -compare;
    });

    return copied;
  }, [filteredRows, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, roleFilter, methodFilter, statusFilter, sortField, sortDirection, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const onSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    if (field === "createdAt" || field === "statusCode" || field === "durationMs") {
      setSortDirection("desc");
      return;
    }

    setSortDirection("asc");
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-primary-dark">ประวัติการใช้งานระบบ</h1>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <p className="text-xs text-slate-600">รายการทั้งหมด</p>
          <p className="text-xl font-semibold text-primary-dark">{summary.total}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs text-slate-600">สำเร็จ (2xx)</p>
          <p className="text-xl font-semibold text-emerald-800">{summary.success}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-slate-600">ผิดพลาดผู้ใช้ (4xx)</p>
          <p className="text-xl font-semibold text-amber-800">{summary.clientError}</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-xs text-slate-600">ผิดพลาดระบบ (5xx)</p>
          <p className="text-xl font-semibold text-rose-800">{summary.serverError}</p>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
          <p className="text-xs text-slate-600">เวลาเฉลี่ย (ms)</p>
          <p className="text-xl font-semibold text-sky-800">{summary.avgDuration}</p>
        </div>
      </div>

      <div className="grid gap-2 rounded-lg border border-orange-100 bg-white p-3 md:grid-cols-2 xl:grid-cols-4">
        <input
          className="rounded border px-3 py-2"
          placeholder="ค้นหา ผู้ใช้/เส้นทาง/รายละเอียด"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select className="rounded border px-3 py-2" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role === "all" ? "ทุกบทบาท" : role}
            </option>
          ))}
        </select>
        <select className="rounded border px-3 py-2" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
          {methodOptions.map((method) => (
            <option key={method} value={method}>
              {method === "all" ? "ทุกวิธี" : method}
            </option>
          ))}
        </select>
        <select
          className="rounded border px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">ทุกสถานะ</option>
          <option value="success">สำเร็จ (2xx)</option>
          <option value="clientError">ผิดพลาดผู้ใช้ (4xx)</option>
          <option value="serverError">ผิดพลาดระบบ (5xx)</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-orange-100 bg-white p-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">ต่อหน้า</span>
          <select
            className="rounded border px-2 py-1"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-slate-600">รายการ</span>
        </div>

        <div className="text-sm text-slate-600">
          หน้า {page} / {totalPages} (ทั้งหมด {sortedRows.length} รายการ)
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
          >
            ก่อนหน้า
          </button>
          <button
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            ถัดไป
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-orange-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-orange-50 text-primary-dark">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => onSort("createdAt")}>
                  วันเวลา {sortField === "createdAt" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => onSort("username")}>
                  ผู้ใช้งาน {sortField === "username" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => onSort("action")}>
                  รายการที่ทำ {sortField === "action" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => onSort("method")}>
                  วิธี {sortField === "method" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => onSort("statusCode")}>
                  ผลลัพธ์ {sortField === "statusCode" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => onSort("durationMs")}>
                  เวลาใช้ {sortField === "durationMs" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{formatThaiDateTime(r.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{r.username || "-"}</div>
                  <div className="text-xs text-slate-500">{r.role || "-"}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{getActionLabel(r.method, r.path)}</div>
                  <div className="text-xs text-slate-500">{r.path}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getMethodClassName(r.method)}`}>
                    {r.method.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusClassName(r.statusCode)}`}>
                    {r.statusCode}
                  </span>
                </td>
                <td className="px-4 py-3">{r.durationMs} ms</td>
                <td className="px-4 py-3">{r.detail || "-"}</td>
              </tr>
            ))}
            {pagedRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-slate-500">
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
