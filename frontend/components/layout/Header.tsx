"use client";

import { useAuth } from "@/lib/auth";
import { 
  Bell, 
  Search, 
  User, 
  Settings,
  HelpCircle,
  Menu
} from "lucide-react";
import { useState } from "react";

export function Header() {
  const { user } = useAuth();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="h-20 px-8 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-xl z-40 border-b border-orange-100/50">
      <div className="flex items-center gap-4 flex-1">
        <button className="lg:hidden p-2 hover:bg-orange-50 rounded-xl transition-colors text-slate-500">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className={`relative max-w-md w-full transition-all duration-300 ${isSearchFocused ? "scale-[1.02]" : ""}`}>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className={`w-4 h-4 transition-colors duration-200 ${isSearchFocused ? "text-orange-500" : "text-slate-400"}`} />
          </div>
          <input
            type="text"
            placeholder="ค้นหาอุปกรณ์, พนักงาน..."
            className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all shadow-sm"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>

        <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-none">{user?.username ?? "ผู้ดูแลระบบ"}</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">{user?.role === "admin" ? "ผู้บริหารระบบ" : "พนักงาน"}</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <User className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>
    </header>
  );
}
