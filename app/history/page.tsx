"use client";

import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/api/screenings?limit=200")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRows(d);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-3 text-center">
        ประวัติการคัดกรอง
      </h1>

      <div className="max-h-[75vh] overflow-y-auto text-xs space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="border rounded p-2">
            <div className="font-semibold">
              {r.fullname || r.citizen_id || "ไม่ระบุชื่อ"}
            </div>
            <div className="text-gray-500">
              {new Date(r.created_at).toLocaleString("th-TH")}
            </div>
            <div>
              ระดับความเสี่ยง:{" "}
              <span className="font-semibold">{r.risk_level}</span>
            </div>
            <div>คะแนน stress: {r.stress_score ?? "-"}</div>
            <div>คะแนน 8Q: {r.q8_total}</div>
          </div>
        ))}

        {rows.length === 0 && (
          <p className="text-center text-gray-400">
            ยังไม่มีข้อมูลการคัดกรอง
          </p>
        )}
      </div>
    </div>
  );
}
