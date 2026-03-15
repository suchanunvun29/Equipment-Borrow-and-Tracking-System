"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatThaiDate, getTodayIsoDate } from "@/lib/date";

type ThaiDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const THAI_WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(year, month, day);
}

export function ThaiDatePicker({ value, onChange, placeholder = "เลือกวันที่", className }: ThaiDatePickerProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? new Date().getMonth());
  const yearOptions = useMemo(() => Array.from({ length: 21 }, (_, i) => viewYear - 10 + i), [viewYear]);

  useEffect(() => {
    if (!selectedDate) return;
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [selectedDate]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
      return;
    }
    setViewMonth((prev) => prev - 1);
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
      return;
    }
    setViewMonth((prev) => prev + 1);
  };

  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const leadingDays = Array.from({ length: firstDayIndex }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectDate = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    onChange(toIsoDate(date));
    setOpen(false);
  };

  const selectToday = () => {
    onChange(getTodayIsoDate());
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded border px-3 py-2 text-left"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{selectedDate ? formatThaiDate(selectedDate) : <span className="text-slate-500">{placeholder}</span>}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5 text-slate-500"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3m8-3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Z" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className="rounded border px-2 py-1 text-sm" onClick={goPrevMonth}>
              {"<"}
            </button>
            <div className="flex items-center gap-2">
              <select
                className="rounded border px-2 py-1 text-sm"
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
              >
                {THAI_MONTHS.map((monthName, index) => (
                  <option key={monthName} value={index}>
                    {monthName}
                  </option>
                ))}
              </select>
              <select
                className="rounded border px-2 py-1 text-sm"
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year + 543}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="rounded border px-2 py-1 text-sm" onClick={goNextMonth}>
              {">"}
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-600">
            {THAI_WEEKDAYS.map((day) => (
              <div key={day} className="py-1 font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {leadingDays.map((d) => (
              <div key={`empty-${d}`} className="h-8" />
            ))}
            {monthDays.map((day) => {
              const iso = toIsoDate(new Date(viewYear, viewMonth, day));
              const isSelected = value === iso;
              return (
                <button
                  key={day}
                  type="button"
                  className={`h-8 rounded ${
                    isSelected ? "bg-primary text-white" : "hover:bg-orange-100"
                  }`}
                  onClick={() => selectDate(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button type="button" className="text-sm text-slate-600 hover:text-slate-900" onClick={() => onChange("")}>
              ล้างค่า
            </button>
            <button type="button" className="text-sm text-primary-dark hover:underline" onClick={selectToday}>
              วันนี้
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
