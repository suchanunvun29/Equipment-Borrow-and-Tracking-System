"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { appLogger } from "@/lib/logger";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      appLogger.info("เริ่มเข้าสู่ระบบ", { username });
      const res = await api.auth.login({ username, password });
      localStorage.setItem("token", res.token);
      window.location.href = "/dashboard";
    } catch {
      appLogger.warn("เข้าสู่ระบบไม่สำเร็จ", { username });
      setError("เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูล");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-6 w-full max-w-md border border-orange-100">
        <h1 className="text-xl font-bold text-primary-dark">เข้าสู่ระบบ</h1>
        <div className="mt-4 space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        <button className="mt-5 w-full bg-primary hover:bg-primary-dark text-white rounded-lg py-2">เข้าสู่ระบบ</button>
        <p className="text-sm mt-3 text-center">
          ยังไม่มีบัญชี?{" "}
          <Link className="text-primary-dark underline" href="/register">
            ลงทะเบียน
          </Link>
        </p>
      </form>
    </main>
  );
}
