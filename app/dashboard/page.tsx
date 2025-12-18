"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  HeartPulse,
  TrendingUp,
  Users
} from "lucide-react";

type ScreeningRow = Record<string, any>;

type SeverityBucket = "normal" | "mild" | "moderate" | "severe";

const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
  trend
}: {
  title: string;
  value: number | string;
  subtext?: string;
  icon: any;
  colorClass: string;
  trend?: "up" | "down";
}) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
        <div className="text-3xl font-bold text-slate-800">{value}</div>
      </div>
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${colorClass.replace("bg-", "text-")}`} />
      </div>
    </div>
    {subtext && (
      <div className="flex items-center text-sm">
        {trend === "up" ? (
          <ArrowUpRight className="w-4 h-4 text-red-500 mr-1" />
        ) : trend === "down" ? (
          <ArrowDownRight className="w-4 h-4 text-green-500 mr-1" />
        ) : null}
        <span className="text-slate-400">{subtext}</span>
      </div>
    )}
  </div>
);

const severityColors: Record<SeverityBucket, string> = {
  normal: "#10B981",
  mild: "#FBBF24",
  moderate: "#F97316",
  severe: "#EF4444"
};

const levelMap: Record<string, SeverityBucket> = {
  normal: "normal",
  minimal: "normal",
  none: "normal",
  mild: "mild",
  moderate: "moderate",
  "moderately severe": "severe",
  "moderate-severe": "severe",
  "mod-severe": "severe",
  "mod severe": "severe",
  severe: "severe",
  high: "severe"
};

const scoreKeys = [
  "nine_q_score",
  "phq9_total",
  "phq9_score",
  "q9_total",
  "score_9q",
  "phq9"
];

const parseNumber = (val: unknown): number | null => {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string" && val.trim() !== "") {
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  }
  return null;
};

const scoreToSeverity = (score: number): SeverityBucket => {
  if (score <= 4) return "normal";
  if (score <= 9) return "mild";
  if (score <= 14) return "moderate";
  return "severe";
};

const normalizeSeverity = (row: ScreeningRow): SeverityBucket => {
  const rawLevel = (row?.nine_q_level || row?.phq9_level || row?.risk_level || "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const mapped = levelMap[rawLevel as keyof typeof levelMap];
  if (mapped) return mapped;

  const score = scoreKeys
    .map((k) => parseNumber(row?.[k]))
    .find((v) => v !== null);

  if (score !== undefined && score !== null) return scoreToSeverity(score);

  return "normal";
};

const formatDate = (val: string | number | Date) => {
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
};

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [rows, setRows] = useState<ScreeningRow[]>([]);

  useEffect(() => {
    fetch("/api/screenings?limit=1000")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRows(d);
      })
      .catch(console.error);
  }, []);

  const filteredRows = useMemo(() => {
    if (rows.length === 0) return [];
    const days = timeRange === "7d" ? 7 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return rows.filter((r) => {
      const created = new Date(r.created_at).getTime();
      if (Number.isNaN(created)) return false;
      return created >= cutoff;
    });
  }, [rows, timeRange]);

  const stats = useMemo(() => {
    const data = filteredRows.length ? filteredRows : rows;
    const total = data.length;
    const highStress = data.filter((d) => (parseNumber(d.stress_level) ?? 0) >= 4).length;
    const suicideRisk = data.filter((d) => parseNumber(d.suicide_risk) === 1).length;
    const severeDepression = data.filter((d) => normalizeSeverity(d) === "severe").length;

    return { total, highStress, suicideRisk, severeDepression };
  }, [filteredRows, rows]);

  const stressDistribution = useMemo(() => {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const data = filteredRows.length ? filteredRows : rows;
    data.forEach((d) => {
      const s = parseNumber(d.stress_level);
      if (s && dist[s] !== undefined) dist[s] += 1;
    });
    return Object.keys(dist).map((k) => ({ level: `ระดับ ${k}`, count: dist[Number(k)] }));
  }, [filteredRows, rows]);

  const depressionSeverity = useMemo(() => {
    const dist: Record<SeverityBucket, number> = {
      normal: 0,
      mild: 0,
      moderate: 0,
      severe: 0
    };
    const data = filteredRows.length ? filteredRows : rows;
    data.forEach((d) => {
      const bucket = normalizeSeverity(d);
      dist[bucket] += 1;
    });
    return (Object.keys(dist) as SeverityBucket[]).map((key) => ({
      name:
        key === "normal"
          ? "ปกติ (Normal)"
          : key === "mild"
          ? "เล็กน้อย (Mild)"
          : key === "moderate"
          ? "ปานกลาง (Moderate)"
          : "รุนแรง (Severe)",
      value: dist[key],
      color: severityColors[key]
    }));
  }, [filteredRows, rows]);

  const dailyTrend = useMemo(() => {
    const data = filteredRows.length ? filteredRows : rows;
    const daily: Record<string, number> = {};
    data.forEach((d) => {
      const key = formatDate(d.created_at);
      if (key === "-") return;
      daily[key] = (daily[key] || 0) + 1;
    });
    return Object.keys(daily)
      .sort()
      .map((date) => ({
        date: date.slice(5).replace("-", "/"),
        count: daily[date]
      }));
  }, [filteredRows, rows]);

  const highRiskList = useMemo(() => {
    const data = filteredRows.length ? filteredRows : rows;
    return data
      .filter((d) => parseNumber(d.suicide_risk) === 1 || normalizeSeverity(d) === "severe")
      .sort((a, b) => {
        const da = new Date(a.created_at).getTime();
        const db = new Date(b.created_at).getTime();
        if (!Number.isNaN(da) && !Number.isNaN(db)) return db - da;
        return (parseNumber(b.id) ?? 0) - (parseNumber(a.id) ?? 0);
      })
      .slice(0, 5);
  }, [filteredRows, rows]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mental Health Monitor</h1>
          <p className="text-slate-500 text-sm mt-1">รายงานสถานะสุขภาพจิตบุคลากร (Executive View)</p>
        </div>

        <div className="flex items-center space-x-3 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              timeRange === "7d" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => setTimeRange("7d")}
          >
            7 วันล่าสุด
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              timeRange === "30d" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => setTimeRange("30d")}
          >
            30 วัน
          </button>
        </div>
      </header>

      <div className="mb-4">
        <Link
          href="/history"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 underline underline-offset-2"
        >
          ← ดูประวัติการคัดกรอง
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="ผู้ทำแบบประเมินทั้งหมด"
          value={stats.total}
          subtext="รวมตามช่วงวันที่เลือก"
          icon={Users}
          colorClass="bg-indigo-600 text-indigo-600"
          trend="down"
        />
        <StatCard
          title="ความเครียดสูง (≥4)"
          value={stats.highStress}
          subtext={`${stats.total ? ((stats.highStress / stats.total) * 100).toFixed(1) : 0}% ของผู้ประเมิน`}
          icon={Activity}
          colorClass="bg-orange-500 text-orange-500"
          trend="up"
        />
        <StatCard
          title="ซึมเศร้ารุนแรง (Severe)"
          value={stats.severeDepression}
          subtext="ต้องการการดูแลเร่งด่วน"
          icon={HeartPulse}
          colorClass="bg-red-500 text-red-500"
          trend="up"
        />
        <StatCard
          title="เสี่ยงฆ่าตัวตาย"
          value={stats.suicideRisk}
          subtext="ส่งต่อจิตแพทย์ / แจ้งเฝ้าระวัง"
          icon={AlertTriangle}
          colorClass="bg-rose-600 text-rose-600"
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              แนวโน้มการทำแบบประเมินรายวัน
            </h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                  name="จำนวนผู้ประเมิน"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              ความรุนแรง (9Q)
            </h2>
          </div>
          <div className="h-72 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={depressionSeverity} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {depressionSeverity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full text-center pointer-events-none">
              <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-xs text-slate-400">Cases</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            การกระจายระดับความเครียด (1-5)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stressDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="level"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <RechartsTooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="จำนวนคน" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              เคสความเสี่ยงสูง (High Risk Cases)
            </h2>
            <span className="text-xs font-semibold text-indigo-600">ช่วง {timeRange === "7d" ? "7 วัน" : "30 วัน"}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Group</th>
                  <th className="pb-3 font-medium">Stress</th>
                  <th className="pb-3 font-medium">Severity</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {highRiskList.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-3 text-slate-500 font-mono">{formatDate(item.created_at)}</td>
                    <td className="py-3 text-slate-700 font-medium">{item.line_group_id || "-"}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-200 rounded-full h-1.5 w-16">
                          <div
                            className={`h-1.5 rounded-full ${
                              (parseNumber(item.stress_level) ?? 0) >= 4 ? "bg-red-500" : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(100, ((parseNumber(item.stress_level) ?? 0) / 5) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{parseNumber(item.stress_level) ?? "-"}/5</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          normalizeSeverity(item) === "severe"
                            ? "bg-red-100 text-red-800"
                            : normalizeSeverity(item) === "moderate"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {normalizeSeverity(item).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3">
                      {parseNumber(item.suicide_risk) === 1 ? (
                        <span className="flex items-center text-xs font-bold text-rose-600 animate-pulse">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Risk
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {highRiskList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลความเสี่ยงสูง
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
