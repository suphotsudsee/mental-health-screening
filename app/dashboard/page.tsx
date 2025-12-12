"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/screenings?limit=500")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRows(d);
      })
      .catch(console.error);
  }, []);

  const count = (lvl: string) => rows.filter((r) => r.risk_level === lvl).length;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="rounded border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
        >
          กลับหน้าแรก
        </Link>
        <h1 className="flex-1 text-center text-xl font-bold">Dashboard ผู้บริหาร</h1>
        <div className="w-[96px]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="ไม่พบความเสี่ยง" value={count("none")} color="bg-emerald-100" />
        <StatCard label="เสี่ยงน้อย" value={count("low")} color="bg-yellow-100" />
        <StatCard label="เสี่ยงปานกลาง" value={count("medium")} color="bg-orange-100" />
        <StatCard label="เสี่ยงสูง" value={count("high")} color="bg-rose-200" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`p-3 rounded text-center ${color}`}>
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
