import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Equipment Borrow System",
  description: "ระบบจัดการยืม-คืนอุปกรณ์",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
