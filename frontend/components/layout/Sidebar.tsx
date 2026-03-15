"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Tags, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Activity, 
  FileText,
  LogOut,
  ChevronRight
} from "lucide-react";

interface MenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const menus: MenuItem[] = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/borrow", label: "การยืมอุปกรณ์", icon: ArrowUpRight },
  { href: "/return", label: "การคืนอุปกรณ์", icon: ArrowDownLeft, adminOnly: true },
  { href: "/equipment", label: "จัดการอุปกรณ์", icon: Package, adminOnly: true },
  { href: "/equipment-categories", label: "ประเภทอุปกรณ์", icon: Tags, adminOnly: true },
  { href: "/employees", label: "พนักงาน", icon: Users, adminOnly: true },
  { href: "/history", label: "ประวัติการยืม/คืน", icon: History },
  { href: "/system-usage", label: "ประวัติการใช้งานระบบ", icon: Activity, adminOnly: true },
  { href: "/reports", label: "รายงาน", icon: FileText, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filtered = menus.filter((m) => !m.adminOnly || user?.role === "admin");

  return (
    <aside className="w-72 bg-sidebar text-orange-50 min-h-screen p-6 flex flex-col sticky top-0 h-screen overflow-y-auto z-50">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-950/40 border border-orange-500/30">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">EquipTrace</h2>
            <p className="text-[10px] text-orange-300/80 uppercase tracking-widest font-medium">ยืม & ติดตาม</p>
          </div>
        </div>

        <div className="bg-orange-800/30 rounded-2xl p-4 mb-8 border border-orange-700/20">
          <p className="text-[10px] text-orange-300/70 uppercase tracking-wider font-semibold mb-1">ลงชื่อเข้าใช้ในฐานะ</p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold truncate max-w-[140px]">{user?.username ?? "แอดมิน"}</p>
            <span className="px-2 py-0.5 bg-orange-600/50 rounded-full text-[10px] text-orange-100 border border-orange-500/20 capitalize">
              {user?.role === "admin" ? "ผู้ดูแลระบบ" : "พนักงาน"}
            </span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {filtered.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between group px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-950/20" 
                    : "text-orange-200/70 hover:bg-orange-800/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-orange-200/50" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto">
        <button 
          className="w-full flex items-center justify-center gap-2 bg-orange-600/20 hover:bg-orange-600 text-orange-200 hover:text-white border border-orange-600/30 hover:border-orange-500 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200" 
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}

