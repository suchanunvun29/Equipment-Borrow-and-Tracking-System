"use client";

import { useEffect, useMemo, useState } from "react";
import { Table } from "@/components/ui/Table";
import { api } from "@/lib/api";

interface EmployeeRow {
  id: string;
  username: string;
  fullName: string;
  employeeCode?: string;
  department?: string;
  role: string;
}

type SortField = "username" | "fullName" | "employeeCode" | "department" | "role";
type SortDirection = "asc" | "desc";

export default function EmployeesPage() {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [sortField, setSortField] = useState<SortField>("username");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    api.employees.list().then(setRows).catch(() => setRows([]));
  }, []);

  const sortedRows = useMemo(() => {
    const copied = [...rows];
    copied.sort((a, b) => {
      let compare = 0;

      switch (sortField) {
        case "username":
          compare = a.username.localeCompare(b.username, "th");
          break;
        case "fullName":
          compare = a.fullName.localeCompare(b.fullName, "th");
          break;
        case "employeeCode":
          compare = (a.employeeCode ?? "").localeCompare(b.employeeCode ?? "", "th");
          break;
        case "department":
          compare = (a.department ?? "").localeCompare(b.department ?? "", "th");
          break;
        case "role":
          compare = a.role.localeCompare(b.role, "th");
          break;
      }

      return sortDirection === "asc" ? compare : -compare;
    });

    return copied;
  }, [rows, sortField, sortDirection]);

  const onSort = (columnIndex: number) => {
    const fields: SortField[] = ["username", "fullName", "employeeCode", "department", "role"];
    const nextField = fields[columnIndex];
    if (!nextField) return;

    if (sortField === nextField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(nextField);
    setSortDirection("asc");
  };

  const sortColumnMap: Record<SortField, number> = {
    username: 0,
    fullName: 1,
    employeeCode: 2,
    department: 3,
    role: 4,
  };

  return (
    <section>
      <h1 className="text-2xl font-bold text-primary-dark mb-4">พนักงาน</h1>
      <Table
        columns={["ชื่อผู้ใช้", "ชื่อ-นามสกุล", "รหัสพนักงาน", "แผนก", "บทบาท"]}
        rows={sortedRows.map((r) => [r.username, r.fullName, r.employeeCode ?? "-", r.department ?? "-", r.role])}
        sortableColumns={[0, 1, 2, 3, 4]}
        sortColumn={sortColumnMap[sortField]}
        sortDirection={sortDirection}
        onSort={onSort}
      />
    </section>
  );
}
