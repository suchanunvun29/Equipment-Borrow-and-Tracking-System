"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { appLogger } from "@/lib/logger";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
    employeeCode: "",
    department: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      appLogger.info("เริ่มลงทะเบียนผู้ใช้", { username: form.username });
      await api.auth.register(form);
      appLogger.info("ลงทะเบียนผู้ใช้สำเร็จ", { username: form.username });
      setMessage("ลงทะเบียนสำเร็จ กรุณาเข้าสู่ระบบ");
      setForm({ username: "", password: "", fullName: "", employeeCode: "", department: "" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ลงทะเบียนไม่สำเร็จ";
      appLogger.error("ลงทะเบียนผู้ใช้ไม่สำเร็จ", { username: form.username, message: msg });
      setError(msg);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-6 w-full max-w-md border border-orange-100">
        <h1 className="text-xl font-bold text-primary-dark">ลงทะเบียนผู้ใช้งาน</h1>
        <div className="mt-4 space-y-3">
          <input className="w-full border rounded-lg px-3 py-2" placeholder="ชื่อผู้ใช้" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <input type="password" className="w-full border rounded-lg px-3 py-2" placeholder="รหัสผ่าน" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="ชื่อ-นามสกุล" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="รหัสพนักงาน" value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="แผนก" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        </div>
        {message && <p className="text-green-700 text-sm mt-3">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        <button className="mt-5 w-full bg-primary hover:bg-primary-dark text-white rounded-lg py-2">ลงทะเบียน</button>
      </form>
    </main>
  );
}
