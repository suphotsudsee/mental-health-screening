"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ScreeningRow = Record<string, any>;
type Severity =
  | "minimal"
  | "mild"
  | "moderate"
  | "moderately_severe"
  | "severe"
  | "unknown";

const severityCards: Array<{
  key: Severity;
  label: string;
  color: string;
}> = [
  { key: "minimal", label: "0-4 คะแนน (ปกติ/ต่ำมาก)", color: "bg-emerald-100" },
  { key: "mild", label: "5-9 คะแนน (น้อย)", color: "bg-lime-100" },
  { key: "moderate", label: "10-14 คะแนน (ปานกลาง)", color: "bg-yellow-100" },
  { key: "moderately_severe", label: "15-19 คะแนน (ค่อนข้างรุนแรง)", color: "bg-orange-100" },
  { key: "severe", label: "20-27 คะแนน (รุนแรง)", color: "bg-rose-200" }
];

const levelMap: Record<string, Severity> = {
  minimal: "minimal",
  normal: "minimal",
  none: "minimal",
  "no risk": "minimal",
  mild: "mild",
  low: "mild",
  moderate: "moderate",
  medium: "moderate",
  "moderately severe": "moderately_severe",
  "moderate-severe": "moderately_severe",
  "mod-severe": "moderately_severe",
  "mod severe": "moderately_severe",
  severe: "severe",
  high: "severe"
};

const scoreKeys = ["phq9_total", "phq9_score", "q9_total", "score_9q", "phq9"];

const parseNumber = (val: unknown): number | null => {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string" && val.trim() !== "") {
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  }
  return null;
};

const getPhq9Score = (row: ScreeningRow): number | null => {
  for (const key of scoreKeys) {
    const num = parseNumber(row?.[key]);
    if (num !== null) return num;
  }
  return null;
};

const scoreToSeverity = (score: number): Severity => {
  if (score <= 4) return "minimal";
  if (score <= 9) return "mild";
  if (score <= 14) return "moderate";
  if (score <= 19) return "moderately_severe";
  return "severe";
};

const normalizeSeverity = (row: ScreeningRow): Severity => {
  const rawLevel = (row?.phq9_level || row?.risk_level || "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const mapped = levelMap[rawLevel as keyof typeof levelMap];

  if (mapped) return mapped;

  const score = getPhq9Score(row);
  if (score !== null) return scoreToSeverity(score);

  return "unknown";
};

export default function DashboardPage() {
  const [rows, setRows] = useState<ScreeningRow[]>([]);

  useEffect(() => {
    fetch("/api/screenings?limit=500")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRows(d);
      })
      .catch(console.error);
  }, []);

  const severityCounts = useMemo(() => {
    const counts: Record<Severity, number> = {
      minimal: 0,
      mild: 0,
      moderate: 0,
      moderately_severe: 0,
      severe: 0,
      unknown: 0
    };

    rows.forEach((row) => {
      const level = normalizeSeverity(row);
      counts[level] = (counts[level] || 0) + 1;
    });

    return counts;
  }, [rows]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="rounded border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
        >
          กลับหน้าหลัก
        </Link>
        <h1 className="flex-1 text-center text-xl font-bold">Dashboard ผู้บริหาร</h1>
        <div className="w-[96px]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {severityCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={severityCounts[card.key]}
            color={card.color}
          />
        ))}
      </div>

      {severityCounts.unknown > 0 && (
        <div className="text-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          {severityCounts.unknown} รายการไม่สามารถจัดระดับ 9Q ได้ (ข้อมูลไม่ครบหรือรูปแบบไม่ตรง)
        </div>
      )}
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
