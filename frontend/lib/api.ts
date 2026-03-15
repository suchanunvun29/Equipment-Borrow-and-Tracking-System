const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

async function fetchWithAuth(path: string, init?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({} as { message?: string }));
    throw new Error(err.message ?? "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export interface EquipmentPayload {
  code: string;
  name: string;
  model?: string;
  categoryId?: string;
  categoryName?: string;
  totalQuantity: number;
  availableQty: number;
  description?: string;
}

export interface EquipmentCategoryPayload {
  name: string;
  description?: string;
}

export interface BorrowPayload {
  equipmentId: string;
  borrowDate: string;
  expectedReturn?: string;
  notes?: string;
}

export interface ReturnPayload {
  borrowId: string;
  returnDate: string;
  returnReason: "normal" | "resigned" | "broken" | "other";
  conditionNote?: string;
}

export interface ResignedReturnPayload {
  returnDate: string;
  conditionNote?: string;
}

export interface SystemUsageLogRow {
  id: string;
  userId?: string;
  username: string;
  role: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  detail?: string;
  createdAt: string;
}

export const api = {
  auth: {
    login: (data: { username: string; password: string }) =>
      fetchWithAuth("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    register: (data: {
      username: string;
      password: string;
      fullName: string;
      employeeCode?: string;
      department?: string;
    }) => fetchWithAuth("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  },
  employees: {
    list: () => fetchWithAuth("/employee"),
  },
  equipment: {
    list: () => fetchWithAuth("/equipment"),
    getById: (id: string) => fetchWithAuth(`/equipment/${id}`),
    create: (data: EquipmentPayload) =>
      fetchWithAuth("/equipment", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: EquipmentPayload) =>
      fetchWithAuth(`/equipment/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithAuth(`/equipment/${id}`, { method: "DELETE" }),
  },
  equipmentCategory: {
    list: () => fetchWithAuth("/equipmentcategory"),
    getById: (id: string) => fetchWithAuth(`/equipmentcategory/${id}`),
    create: (data: EquipmentCategoryPayload) =>
      fetchWithAuth("/equipmentcategory", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: EquipmentCategoryPayload) =>
      fetchWithAuth(`/equipmentcategory/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithAuth(`/equipmentcategory/${id}`, { method: "DELETE" }),
  },
  borrow: {
    list: () => fetchWithAuth("/borrow"),
    create: (data: BorrowPayload) => fetchWithAuth("/borrow", { method: "POST", body: JSON.stringify(data) }),
    approve: (id: string) => fetchWithAuth(`/borrow/${id}/approve`, { method: "POST" }),
    reject: (id: string, note?: string) =>
      fetchWithAuth(`/borrow/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) }),
  },
  return: {
    list: () => fetchWithAuth("/return"),
    process: (data: ReturnPayload) => fetchWithAuth("/return", { method: "POST", body: JSON.stringify(data) }),
    outstandingByEmployee: (employeeId: string) => fetchWithAuth(`/return/outstanding/${employeeId}`),
    processResigned: (employeeId: string, data: ResignedReturnPayload) =>
      fetchWithAuth(`/return/resigned/${employeeId}`, { method: "POST", body: JSON.stringify(data) }),
  },
  reports: {
    summary: () => fetchWithAuth("/reports/summary"),
    byPeriod: (from: string, to: string) => fetchWithAuth(`/reports/period?from=${from}&to=${to}`),
    equipment: () => fetchWithAuth("/reports/equipment"),
    overdue: () => fetchWithAuth("/reports/overdue"),
  },
  systemUsage: {
    list: (limit = 200): Promise<SystemUsageLogRow[]> => fetchWithAuth(`/systemusagelog?limit=${limit}`),
  },
};

