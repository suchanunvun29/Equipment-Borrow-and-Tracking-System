type StatusMeta = {
  label: string;
  className: string;
};

export function getBorrowStatusMeta(status: string): StatusMeta {
  switch (status) {
    case "pending":
      return {
        label: "รออนุมัติ",
        className: "bg-yellow-200 text-yellow-900 border border-yellow-500 shadow-sm",
      };
    case "approved":
      return {
        label: "อนุมัติแล้ว",
        className: "bg-emerald-200 text-emerald-900 border border-emerald-500 shadow-sm",
      };
    case "rejected":
      return {
        label: "ปฏิเสธ",
        className: "bg-rose-200 text-rose-900 border border-rose-500 shadow-sm",
      };
    case "returned":
      return {
        label: "คืนแล้ว",
        className: "bg-cyan-200 text-cyan-900 border border-cyan-500 shadow-sm",
      };
    default:
      return {
        label: "ไม่ระบุสถานะ",
        className: "bg-slate-100 text-slate-900 border border-slate-300 shadow-sm",
      };
  }
}

export function getEquipmentStatusMeta(status: string): StatusMeta {
  switch (status) {
    case "available":
      return {
        label: "พร้อมใช้งาน",
        className: "bg-teal-200 text-teal-900 border border-teal-500 shadow-sm",
      };
    case "out_of_stock":
      return {
        label: "หมดสต็อก",
        className: "bg-orange-200 text-orange-900 border border-orange-500 shadow-sm",
      };
    default:
      return {
        label: "ไม่ระบุสถานะ",
        className: "bg-slate-100 text-slate-900 border border-slate-300 shadow-sm",
      };
  }
}
