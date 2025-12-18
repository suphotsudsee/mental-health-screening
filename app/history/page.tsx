"use client";

import Link from "next/link";
import jsPDF from "jspdf";
import { useEffect, useMemo, useState } from "react";

type ScreeningRow = Record<string, any>;

let sarabunFontB64: string | null = null;

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

const ensureSarabunFont = async () => {
  if (sarabunFontB64) return sarabunFontB64;
  const res = await fetch("/fonts/Sarabun-Regular.ttf");
  if (!res.ok) throw new Error("โหลดฟอนต์ Sarabun ไม่สำเร็จ");
  const buffer = await res.arrayBuffer();
  sarabunFontB64 = arrayBufferToBase64(buffer);
  return sarabunFontB64;
};

const parseNumber = (val: unknown): number | null => {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string" && val.trim() !== "") {
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  }
  return null;
};

const twoQRiskLabel = (row: ScreeningRow) => {
  const risk = parseNumber(row.two_q_risk) ?? 0;
  const q1 = parseNumber(row.two_q1) ?? parseNumber(row.q1) ?? 0;
  const q2 = parseNumber(row.two_q2) ?? parseNumber(row.q2) ?? 0;
  const q3 = parseNumber(row.two_q3) ?? parseNumber(row.q3) ?? 0;
  const positive = risk === 1 || q1 === 1 || q2 === 1 || q3 === 1;
  return {
    positive,
    detail: `Q1=${q1} Q2=${q2} Q3=${q3}`
  };
};

const nineQLabel = (row: ScreeningRow) => {
  const score =
    parseNumber(row.nine_q_score) ??
    parseNumber(row.phq9_total) ??
    parseNumber(row.phq9_score) ??
    parseNumber(row.q9_total) ??
    null;
  const level =
    (row.nine_q_level ||
      row.phq9_level ||
      row.risk_level ||
      (score !== null
        ? score >= 20
          ? "severe"
          : score >= 10
          ? "moderate"
          : score >= 5
          ? "mild"
          : "normal"
        : "-")) ?? "-";
  return { score, level };
};

const formatDate = (val: string | number | Date) => {
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH");
};

export default function HistoryPage() {
  const [rows, setRows] = useState<ScreeningRow[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ScreeningRow | null>(null);

  useEffect(() => {
    fetch("/api/screenings?limit=200")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRows(d);
      })
      .catch(console.error);
  }, []);

  const visibleRows = useMemo(() => rows, [rows]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "00022") {
      setAuthorized(true);
      setError("");
    } else {
      setAuthorized(false);
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  const exportPDF = async (data: ScreeningRow) => {
    if (!data) return;
    const doc = new jsPDF();

    try {
      const font = await ensureSarabunFont();
      doc.addFileToVFS("Sarabun-Regular.ttf", font);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.setFont("Sarabun");
    } catch (err) {
      console.error("โหลดฟอนต์ Sarabun ไม่สำเร็จ", err);
    }

    const twoq = twoQRiskLabel(data);
    const nineq = nineQLabel(data);

    doc.setFontSize(16);
    doc.text("ประวัติการคัดกรอง", 10, 20);
    doc.setFontSize(12);
    doc.text(`ชื่อ-สกุล: ${data.fullname || "-"}`, 10, 30);
    doc.text(`เลขบัตร/รหัส: ${data.citizen_id || "-"}`, 10, 36);
    doc.text(`หน่วยบริการ: ${data.facility_code || "-"}`, 10, 42);
    doc.text(`วันเวลาที่คัดกรอง: ${formatDate(data.created_at)}`, 10, 48);
    doc.text(`Stress (1-5): ${data.stress_level ?? "-"}`, 10, 56);
    doc.text(`2Q: ${twoq.positive ? "บวก" : "ลบ"} (${twoq.detail})`, 10, 64);
    doc.text(`9Q: ระดับ ${nineq.level} คะแนน ${nineq.score ?? "-"}`, 10, 72);
    doc.text(`เสี่ยงฆ่าตัวตาย: ${parseNumber(data.suicide_risk) === 1 ? "เสี่ยง" : "ไม่เสี่ยง/ไม่ระบุ"}`, 10, 80);

    doc.save("screening-history.pdf");
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="rounded border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
        >
          กลับหน้าหลัก
        </Link>
        <h1 className="flex-1 text-center text-xl font-bold">ดูประวัติการคัดกรอง</h1>
        <div className="w-[96px]" />
      </div>

      {!authorized && (
        <form onSubmit={handleLogin} className="mb-4 space-y-2 border rounded p-3 bg-slate-50">
          <p className="text-sm text-gray-700">เข้าสู่ระบบผู้ดูแลเพื่อตรวจสอบข้อมูลโดยละเอียด</p>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">ชื่อผู้ใช้</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">รหัสผ่าน</label>
            <input
              type="password"
              className="w-full border rounded px-2 py-1 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button type="submit" className="w-full p-2 rounded bg-emerald-600 text-white text-sm">
            เข้าสู่ระบบ
          </button>
        </form>
      )}

      <div className="max-h-[75vh] overflow-y-auto text-xs space-y-2">
        {visibleRows.map((r) => {
          const twoq = twoQRiskLabel(r);
          const nineq = nineQLabel(r);
          return (
            <button
              key={r.id}
              className="border rounded p-2 text-left w-full hover:bg-slate-50"
              onClick={() => setSelected(r)}
            >
              <div className="font-semibold">
                {authorized ? r.fullname || r.citizen_id || `รายการ #${r.id}` : "ข้อมูลถูกซ่อน (เข้าสู่ระบบเพื่อดู)"}
              </div>
              <div className="text-gray-500">{formatDate(r.created_at)}</div>
              <div>Stress: {r.stress_level ?? "-"}</div>
              <div>
                2Q: <span className={twoq.positive ? "text-rose-600 font-semibold" : ""}>{twoq.positive ? "บวก" : "ลบ"}</span>{" "}
                ({twoq.detail})
              </div>
              <div>
                9Q: ระดับ {nineq.level} คะแนน {nineq.score ?? "-"}
              </div>
              <div>เสี่ยงฆ่าตัวตาย: {parseNumber(r.suicide_risk) === 1 ? "เสี่ยง" : "-"}</div>
            </button>
          );
        })}

        {visibleRows.length === 0 && (
          <p className="text-center text-gray-400">ยังไม่มีข้อมูลคัดกรอง</p>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4">
          <div className="bg-white rounded shadow-lg w-full max-w-lg p-4 space-y-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">รายละเอียดการคัดกรอง</h2>
              <button className="text-sm text-gray-600" onClick={() => setSelected(null)}>
                ปิด
              </button>
            </div>

            <DetailRow label="ชื่อ-สกุล / ID">
              {authorized ? selected.fullname || selected.citizen_id || `รายการ #${selected.id}` : "ข้อมูลถูกซ่อน"}
            </DetailRow>
            {authorized && (
              <>
                <DetailRow label="เลขบัตร/รหัส">{selected.citizen_id || "-"}</DetailRow>
                <DetailRow label="หน่วยบริการ">{selected.facility_code || "-"}</DetailRow>
              </>
            )}
            <DetailRow label="วันเวลาที่คัดกรอง">{formatDate(selected.created_at)}</DetailRow>
            <DetailRow label="Stress (1-5)">{selected.stress_level ?? "-"}</DetailRow>
            <DetailRow label="2Q">
              {twoQRiskLabel(selected).positive ? "บวก" : "ลบ"} ({twoQRiskLabel(selected).detail})
            </DetailRow>
            <DetailRow label="9Q">
              ระดับ {nineQLabel(selected).level} คะแนน {nineQLabel(selected).score ?? "-"}
            </DetailRow>
            <DetailRow label="เสี่ยงฆ่าตัวตาย">
              {parseNumber(selected.suicide_risk) === 1 ? "เสี่ยง" : "ไม่เสี่ยง/ไม่ระบุ"}
            </DetailRow>
            {selected.recommendation && <DetailRow label="คำแนะนำ">{selected.recommendation}</DetailRow>}

            <div className="flex gap-2 pt-2">
              <button className="flex-1 p-2 rounded bg-blue-600 text-white text-sm" onClick={() => exportPDF(selected)}>
                ส่งออก PDF
              </button>
              <button className="flex-1 p-2 rounded bg-slate-100 text-sm" onClick={() => setSelected(null)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: any }) {
  return (
    <div className="text-sm">
      <span className="text-gray-600">{label}: </span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}
