"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Package, 
  ArrowUpRight, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Box,
  CheckCircle2,
  Calendar,
  Activity,
  FileText
} from "lucide-react";

interface Summary {
  totalEquipment: number;
  currentBorrowed: number;
  overdueCount: number;
  pendingApproval: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api.reports.summary().then(setSummary).catch(() => setSummary(null));
  }, []);

  const stats = [
    { 
      label: "อุปกรณ์ทั้งหมด", 
      value: summary?.totalEquipment ?? 0, 
      icon: Package, 
      color: "bg-blue-500",
      description: "รายการในคลัง"
    },
    { 
      label: "กำลังถูกยืม", 
      value: summary?.currentBorrowed ?? 0, 
      icon: ArrowUpRight, 
      color: "bg-orange-500",
      description: "การยืมที่ใช้งานอยู่"
    },
    { 
      label: "รอการอนุมัติ", 
      value: summary?.pendingApproval ?? 0, 
      icon: Clock, 
      color: "bg-amber-500",
      description: "รอการตรวจสอบ"
    },
    { 
      label: "เกินกำหนดคืน", 
      value: summary?.overdueCount ?? 0, 
      icon: AlertCircle, 
      color: "bg-rose-500",
      description: "จำเป็นต้องดำเนินการ" 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-orange-600/70 uppercase tracking-widest mb-1">
          <Calendar className="w-3 h-3" />
          <span>ภาพรวม</span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">แดชบอร์ด</h1>
        <p className="text-slate-500 mt-2 font-medium">ยินดีต้อนรับกลับ! นี่คือสิ่งที่เกิดขึ้นในวันนี้</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.label} 
              className="glass-card premium-shadow rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-300 ${stat.color}`}></div>
              
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-900/10`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500 mb-1">{stat.label}</p>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">หน่วย</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    {stat.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card premium-shadow rounded-3xl p-8 h-80 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Activity className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">ภาพรวมกิจกรรม</h3>
            <p className="text-slate-500 max-w-sm mt-2">แผนภูมิและประวัติกิจกรรมโดยละเอียดจะแสดงที่นี่ในเวอร์ชันถัดไป</p>
          </div>
          <button className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">
            ดูบทวิเคราะห์
          </button>
        </div>

        <div className="glass-card premium-shadow rounded-3xl p-8 flex flex-col h-80">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            การดำเนินการด่วน
          </h3>
          <div className="space-y-3 flex-1">
            {[
              { label: "คำขอยืมอุปกรณ์", icon: Box, href: "/borrow" },
              { label: "ตรวจสอบการอนุมัติ", icon: CheckCircle2, href: "/dashboard" },
              { label: "สร้างรายงาน", icon: FileText, href: "/reports" },
            ].map((action) => (
              <button key={action.label} className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-orange-50 hover:border-orange-200 transition-all group">
                <div className="w-8 h-8 bg-slate-50 group-hover:bg-orange-100 rounded-lg flex items-center justify-center transition-colors">
                  <action.icon className="w-4 h-4 text-slate-500 group-hover:text-orange-600" />
                </div>
                <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
