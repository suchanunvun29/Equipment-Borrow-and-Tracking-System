import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white shadow rounded-2xl p-8 w-full max-w-lg text-center border border-orange-100">
        <h1 className="text-2xl font-bold text-primary-dark">Equipment Borrow System</h1>
        <p className="text-slate-600 mt-2">เริ่มต้นใช้งานระบบจัดการยืม-คืนอุปกรณ์</p>
        <Link
          href="/login"
          className="inline-flex mt-6 bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    </main>
  );
}
