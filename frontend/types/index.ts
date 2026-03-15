export type UserRole = "admin" | "staff";

export interface User {
  id: string;
  username: string;
  fullName: string;
  employeeCode?: string;
  department?: string;
  role: UserRole;
}
