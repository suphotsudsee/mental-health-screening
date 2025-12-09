"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/api/screenings?limit=500")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRows(d);
      })
      .catch(console.error);
  }, []);

  const count = (lvl) => rows.filter((r) => r.risk_level === lvl).length;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-center">
        Dashboard ความเสี่ยงด้านสุขภาพจิต
      </h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="ไม่เสี่ยง" value={count("none")} color="bg-emerald-100" />
        <StatCard label="เสี่ยงน้อย" value={count("low")} color="bg-yellow-100" />
        <StatCard
          label="เสี่ยงปานกลาง"
          value={count("medium")}
          color="bg-orange-100"
        />
        <StatCard label="เสี่ยงรุนแรง" value={count("high")} color="bg-rose-200" />
      </div>

      <h2 className="text-sm font-semibold mt-4">รายการล่าสุด</h2>
      <div className="max-h-[60vh] overflow-y-auto text-xs space-y-1">
        {rows.map((r) => (
          <div key={r.id} className="border-b pb-1">
            <div>{r.fullname || r.citizen_id || "ไม่ระบุชื่อ"}</div>
            <div className="text-gray-500">
              {r.risk_level} •{" "}
              {new Date(r.created_at).toLocaleString("th-TH")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`p-3 rounded text-center ${color}`}>
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
