"use client";

import Link from "next/link";
import jsPDF from "jspdf";
import { useEffect, useState } from "react";

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
  if (!res.ok) throw new Error("โหลดฟอนต์ Sarabun ไม่ได้");
  const buffer = await res.arrayBuffer();
  sarabunFontB64 = arrayBufferToBase64(buffer);
  return sarabunFontB64;
};

export default function HistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/screenings?limit=200")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRows(d);
      })
      .catch(console.error);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "00022") {
      setAuthorized(true);
      setError("");
    } else {
      setAuthorized(false);
      setError("รหัสผ่านไม่ถูกต้อง");
    }
  };

  const exportPDF = async (data: any) => {
    if (!data) return;
    const doc = new jsPDF();

    try {
      const font = await ensureSarabunFont();
      doc.addFileToVFS("Sarabun-Regular.ttf", font);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.setFont("Sarabun");
    } catch (err) {
      console.error("โหลดฟอนต์สำหรับ PDF ไม่สำเร็จ", err);
    }

    doc.setFontSize(16);
    doc.text("ผลการคัดกรอง", 10, 20);
    doc.setFontSize(12);
    doc.text(`ชื่อ: ${data.fullname || "-"}`, 10, 30);
    doc.text(`บัตรประชาชน/รหัส: ${data.citizen_id || "-"}`, 10, 36);
    doc.text(`หน่วยบริการ: ${data.facility_code || "-"}`, 10, 42);
    doc.text(
      `วันที่: ${new Date(data.created_at).toLocaleString("th-TH")}`,
      10,
      48
    );
    doc.text(`คะแนนความเครียด: ${data.stress_score ?? "-"}`, 10, 60);
    doc.text(
      `2Q: Q1=${data.q1 ?? "-"} Q2=${data.q2 ?? "-"} Q3=${data.q3 ?? "-"}`,
      10,
      68
    );
    doc.text(`คะแนนรวม 8Q: ${data.q8_total ?? "-"}`, 10, 76);
    doc.text(`ระดับความเสี่ยง: ${data.risk_level}`, 10, 84);

    if (data.recommendation) {
      doc.text("ข้อแนะนำ:", 10, 96);
      const split = doc.splitTextToSize(data.recommendation, 180);
      doc.text(split, 10, 104);
    }

    doc.save("screening-history.pdf");
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="rounded border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
        >
          กลับหน้าแรก
        </Link>
        <h1 className="flex-1 text-center text-xl font-bold">ประวัติการคัดกรอง</h1>
        <div className="w-[96px]" />
      </div>

      {!authorized && (
        <form
          onSubmit={handleLogin}
          className="mb-4 space-y-2 border rounded p-3 bg-slate-50"
        >
          <p className="text-sm text-gray-700">
            เข้าสู่ระบบเพื่อแสดงข้อมูลส่วนบุคคล
          </p>
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
          <button
            type="submit"
            className="w-full p-2 rounded bg-emerald-600 text-white text-sm"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      )}

      <div className="max-h-[75vh] overflow-y-auto text-xs space-y-2">
        {rows.map((r) => (
          <button
            key={r.id}
            className="border rounded p-2 text-left w-full hover:bg-slate-50"
            onClick={() => setSelected(r)}
          >
            <div className="font-semibold">
              {authorized
                ? r.fullname || r.citizen_id || "ไม่ระบุชื่อ"
                : "ข้อมูลส่วนบุคคล (ล็อกอินเพื่อดู)"}
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
          </button>
        ))}

        {rows.length === 0 && (
          <p className="text-center text-gray-400">ยังไม่มีข้อมูลการคัดกรอง</p>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4">
          <div className="bg-white rounded shadow-lg w-full max-w-lg p-4 space-y-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">รายละเอียดการคัดกรอง</h2>
              <button
                className="text-sm text-gray-600"
                onClick={() => setSelected(null)}
              >
                ปิด
              </button>
            </div>

            <DetailRow label="ชื่อ">
              {authorized
                ? selected.fullname || selected.citizen_id || "ไม่ระบุชื่อ"
                : "ข้อมูลส่วนบุคคล (ล็อกอินเพื่อดู)"}
            </DetailRow>
            {authorized && (
              <>
                <DetailRow label="บัตรประชาชน/รหัส">
                  {selected.citizen_id || "-"}
                </DetailRow>
                <DetailRow label="หน่วยบริการ">
                  {selected.facility_code || "-"}
                </DetailRow>
              </>
            )}
            <DetailRow label="วันที่">
              {new Date(selected.created_at).toLocaleString("th-TH")}
            </DetailRow>
            <DetailRow label="คะแนนความเครียด">
              {selected.stress_score ?? "-"}
            </DetailRow>
            <DetailRow label="2Q">
              Q1={selected.q1 ?? "-"} Q2={selected.q2 ?? "-"} Q3=
              {selected.q3 ?? "-"}
            </DetailRow>
            <DetailRow label="คะแนนรวม 8Q">
              {selected.q8_total ?? "-"}
            </DetailRow>
            <DetailRow label="ระดับความเสี่ยง">
              {selected.risk_level}
            </DetailRow>
            {selected.recommendation && (
              <DetailRow label="ข้อแนะนำ">{selected.recommendation}</DetailRow>
            )}

            <div className="flex gap-2 pt-2">
              <button
                className="flex-1 p-2 rounded bg-blue-600 text-white text-sm"
                onClick={() => exportPDF(selected)}
              >
                พิมพ์ PDF
              </button>
              <button
                className="flex-1 p-2 rounded bg-slate-100 text-sm"
                onClick={() => setSelected(null)}
              >
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
