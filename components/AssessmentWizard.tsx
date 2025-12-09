"use client";

import { useState } from "react";
import jsPDF from "jspdf";

type Step = "stress" | "twoq" | "eightq" | "result";
type RiskLevel = "none" | "low" | "medium" | "high";

const stressOptions = [
  { v: 1, label: "1. เครียดเล็กน้อย สามารถผ่อนคลายได้เอง" },
  { v: 2, label: "2. เครียดเป็นบางครั้ง แต่ยังทำกิจวัตรประจำวันได้" },
  { v: 3, label: "3. เครียดบ่อย กระทบการนอน/กินเล็กน้อย" },
  {
    v: 4,
    label: "4. เครียดมาก จดจ่อไม่ได้ พักผ่อนแล้วยังไม่ดีขึ้น"
  },
  {
    v: 5,
    label: "5. เครียดมากจนควบคุมยาก ส่งผลต่อการใช้ชีวิตชัดเจน"
  }
];

const twoqQuestions = [
  {
    key: "q1",
    text: "ใน 2 สัปดาห์ที่ผ่านมา รู้สึกเบื่อ ท้อแท้ หรือหดหู่บ่อยแค่ไหน?"
  },
  {
    key: "q2",
    text: "ใน 2 สัปดาห์ที่ผ่านมา รู้สึกไม่สนใจสิ่งรอบตัว หรือไม่อยากทำอะไรเลยบ่อยแค่ไหน?"
  },
  {
    key: "q3",
    text: "ในช่วง 1 เดือนที่ผ่านมา เคยคิดไม่อยากมีชีวิตอยู่ หรืออยากทำร้ายตนเองหรือไม่?"
  }
] as const;

const eightQQuestions = [
  "คิดอยากตายบ่อย ๆ หรือไม่?",
  "รู้สึกว่าชีวิตไร้ค่า ไม่อยากอยู่ต่อหรือไม่?",
  "เคยคิดว่าหากตายไป ทุกอย่างจะดีขึ้นหรือไม่?",
  "มีความคิดอยากทำร้ายตนเองหรือไม่?",
  "มีการวางแผนที่จะฆ่าตัวตายหรือไม่?",
  "เคยพยายามทำร้ายตนเองหรือฆ่าตัวตายมาก่อนหรือไม่?",
  "คิดว่าตนเองอาจจะทำร้ายตนเองหรือตายจริงภายใน 1 เดือนนี้หรือไม่?",
  "คิดว่าจะทำร้ายตนเองในตอนนี้ หรือภายใน 24 ชั่วโมงนี้หรือไม่?"
];

const LOW_ACTION = "ให้คำปรึกษา / ติดตามภายใน 1 เดือน";
const MEDIUM_ACTION = "ให้พบแพทย์ / นักจิตวิทยา / นัดติดตามใกล้ชิด";
const HIGH_ACTION =
  "ต้องประเมินโดยแพทย์ทันที ดูแลใกล้ชิด และพิจารณาส่งต่อฉุกเฉิน";

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

export default function AssessmentWizard() {
  const [step, setStep] = useState<Step>("stress");
  const [citizenId, setCitizenId] = useState("");
  const [fullname, setFullname] = useState("");
  const [facilityCode, setFacilityCode] = useState("");

  const [stressScore, setStressScore] = useState<number | null>(null);
  const [twoq, setTwoq] = useState<Record<string, number>>({
    q1: 0,
    q2: 0,
    q3: 0
  });
  const [answers8q, setAnswers8q] = useState<number[]>(Array(8).fill(0));
  const [q8Total, setQ8Total] = useState(0);
  const [riskResult, setRiskResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const update8q = (idx: number, v: number) => {
    const arr = [...answers8q];
    arr[idx] = v;
    const total = arr.reduce((a, b) => a + b, 0);
    setAnswers8q(arr);
    setQ8Total(total);
  };

  const computeRisk = async () => {
    const total8 = answers8q.reduce((a, b) => a + b, 0);
    const hasEmergency = answers8q[6] === 1 || answers8q[7] === 1;
    setQ8Total(total8);

    let level: RiskLevel = "none";
    let recommendation = "ยังไม่พบความเสี่ยงจากแบบประเมิน";

    if (twoq.q3 === 1) {
      if (hasEmergency || total8 >= 4) {
        level = "high";
        recommendation = HIGH_ACTION;
      } else if (total8 >= 2) {
        level = "medium";
        recommendation = MEDIUM_ACTION;
      } else {
        level = "low";
        recommendation = LOW_ACTION;
      }
    } else if (twoq.q1 === 1 || twoq.q2 === 1 || (stressScore ?? 0) >= 4) {
      level = "low";
      recommendation = LOW_ACTION;
    }

    const result = {
      citizen_id: citizenId || null,
      fullname: fullname || null,
      facility_code: facilityCode || null,
      stress_score: stressScore,
      q1: twoq.q1,
      q2: twoq.q2,
      q3: twoq.q3,
      q8_total: total8,
      risk_level: level,
      emergency: hasEmergency,
      recommendation
    };

    setRiskResult(result);
    setStep("result");

    const enableLineNotify =
      process.env.NEXT_PUBLIC_ENABLE_LINE_NOTIFY === "true";

    try {
      setSaving(true);
      await fetch("/api/screenings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result)
      });

      if (enableLineNotify && (level === "medium" || level === "high")) {
        const lineMessage = [
          "แจ้งเตือนผลคัดกรอง 8Q",
          `ระดับความเสี่ยง: ${level.toUpperCase()}`,
          `ชื่อ: ${fullname || "-"}`,
          `คะแนนรวม 8Q: ${total8}`,
          hasEmergency ? "ตอบ “มี” ข้อ 7 หรือ 8 (เร่งด่วน)" : null
        ]
          .filter(Boolean)
          .join("\n");

        const res = await fetch("/api/line-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: lineMessage })
        });

        const data = await res.json();
        if (!res.ok) {
          console.error("LINE error:", data);
          alert("ส่งแจ้งเตือนไป LINE ไม่สำเร็จ\n" + (data.error || ""));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = async () => {
    if (!riskResult) return;
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
    doc.text("แบบประเมินสุขภาพจิต (Stress / 2Q plus / 8Q)", 10, 20);

    doc.setFontSize(12);
    if (riskResult.fullname) {
      doc.text(`ชื่อ: ${riskResult.fullname}`, 10, 30);
    }
    if (riskResult.citizen_id) {
      doc.text(`รหัส/บัตรประชาชน: ${riskResult.citizen_id}`, 10, 36);
    }

    doc.text(
      `คะแนนความเครียด: ${riskResult.stress_score ?? "-"}`,
      10,
      48
    );
    doc.text(`2Q: Q1=${riskResult.q1} Q2=${riskResult.q2} Q3=${riskResult.q3}`, 10, 56);
    doc.text(`คะแนนรวม 8Q: ${riskResult.q8_total}`, 10, 64);
    doc.text(`ระดับความเสี่ยง: ${riskResult.risk_level}`, 10, 72);

    doc.text("ข้อแนะนำ:", 10, 86);
    const split = doc.splitTextToSize(riskResult.recommendation, 180);
    doc.text(split, 10, 94);

    doc.save("screening.pdf");
  };

  // ---------------- UI -----------------

  if (step === "stress") {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-center mb-1">
          แบบประเมินความเครียด
        </h1>

        <div className="bg-slate-50 p-3 rounded-md space-y-2 text-sm">
          <div>
            <label className="block mb-1">รหัส/บัตรประชาชน / HN (ถ้ามี)</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={citizenId}
              onChange={(e) => setCitizenId(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1">ชื่อ - สกุล (ถ้าต้องการบันทึก)</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1">รหัส/ชื่อหน่วยบริการ</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={facilityCode}
              onChange={(e) => setFacilityCode(e.target.value)}
            />
          </div>
        </div>

        <p className="text-sm text-gray-600">
          เลือกข้อที่ตรงกับระดับความเครียดของคุณมากที่สุด ใช้เวลาประเมินสั้น ๆ
          เพื่อเข้าสู่ 2Q plus และ 8Q
        </p>

        {stressOptions.map((o) => (
          <button
            key={o.v}
            onClick={() => setStressScore(o.v)}
            className={`w-full p-3 my-1 rounded border text-left ${
              stressScore === o.v
                ? "bg-emerald-600 text-white border-emerald-700"
                : "bg-slate-50"
            }`}
          >
            {o.label}
          </button>
        ))}

        <button
          disabled={stressScore === null}
          onClick={() => setStep("twoq")}
          className="mt-2 w-full p-3 rounded bg-emerald-700 text-white disabled:bg-gray-400"
        >
          ถัดไป (2Q plus)
        </button>
      </div>
    );
  }

  if (step === "twoq") {
    const setAns = (key: string, v: number) => setTwoq({ ...twoq, [key]: v });

    const goNext = () => {
      if (twoq.q3 === 1) setStep("eightq");
      else computeRisk();
    };

    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-center">แบบประเมิน 2Q plus</h1>

        {twoqQuestions.map(({ key, text }) => (
          <div key={key} className="space-y-1">
            <p>{text}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setAns(key, 0)}
                className={`flex-1 p-2 rounded ${
                  twoq[key] === 0
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100"
                }`}
              >
                ไม่มี
              </button>
              <button
                onClick={() => setAns(key, 1)}
                className={`flex-1 p-2 rounded ${
                  twoq[key] === 1 ? "bg-rose-500 text-white" : "bg-slate-100"
                }`}
              >
                มี
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={goNext}
          className="w-full p-3 rounded bg-emerald-700 text-white"
        >
          ถัดไป
        </button>
      </div>
    );
  }

  if (step === "eightq") {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-center">
          แบบประเมินความเสี่ยงฆ่าตัวตาย (8Q)
        </h1>

        <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded">
          ตอบ “มี/ไม่มี” สำหรับทุกข้อ (มี = 1 คะแนน) หากตอบ “มี” ในข้อ 7 หรือ 8
          ถือว่าเร่งด่วนและจัดเป็นความเสี่ยงสูงทันที
        </div>

        {eightQQuestions.map((text, i) => (
          <div key={i} className="space-y-1">
            <p>
              คำถามที่ {i + 1} : {text}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => update8q(i, 0)}
                className={`flex-1 p-2 rounded ${
                  answers8q[i] === 0
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100"
                }`}
              >
                ไม่มี
              </button>
              <button
                onClick={() => update8q(i, 1)}
                className={`flex-1 p-2 rounded ${
                  answers8q[i] === 1
                    ? "bg-rose-500 text-white"
                    : "bg-slate-100"
                }`}
              >
                มี
              </button>
            </div>
          </div>
        ))}

        <div className="text-sm text-gray-700">
          คะแนนรวมปัจจุบัน: <b>{q8Total}</b>
        </div>

        <button
          onClick={computeRisk}
          className="w-full p-3 rounded bg-emerald-700 text-white"
        >
          สรุปผลประเมิน
        </button>
      </div>
    );
  }

  // RESULT
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-center">ผลการประเมิน</h1>

      {riskResult && (
        <>
          <div className="bg-yellow-50 p-3 rounded text-sm space-y-1">
            {riskResult.fullname && <p>ชื่อ: {riskResult.fullname}</p>}
            {riskResult.citizen_id && (
              <p>รหัส/บัตรประชาชน: {riskResult.citizen_id}</p>
            )}
            <p>คะแนนความเครียด: {riskResult.stress_score ?? "-"}</p>
            <p>2Q: Q1={riskResult.q1} Q2={riskResult.q2} Q3={riskResult.q3}</p>
            <p>คะแนนรวม 8Q: {riskResult.q8_total}</p>
            <p>
              ระดับความเสี่ยง:{" "}
              <b>
                {riskResult.risk_level === "none"
                  ? "ไม่พบความเสี่ยง"
                  : riskResult.risk_level === "low"
                  ? "เสี่ยงน้อย"
                  : riskResult.risk_level === "medium"
                  ? "เสี่ยงปานกลาง"
                  : "เสี่ยงสูง"}
              </b>
              {riskResult.emergency && (
                <span className="ml-2 text-rose-600 font-semibold">
                  (ตอบ “มี” ข้อ 7 หรือ 8 – เร่งด่วน)
                </span>
              )}
            </p>
          </div>

          <div className="bg-emerald-50 p-3 rounded text-sm">
            <b>ข้อแนะนำ:</b>
            <p>{riskResult.recommendation}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={exportPDF}
              className="w-full p-3 rounded bg-blue-600 text-white"
            >
              Export ผลประเมินเป็น PDF
            </button>

            <button
              onClick={() => window.location.assign("/")}
              className="w-full p-3 rounded bg-slate-100 text-center mt-2"
            >
              เริ่มใหม่
            </button>
          </div>

          {saving && (
            <p className="text-xs text-gray-400 text-center">
              กำลังบันทึกข้อมูล...
            </p>
          )}
        </>
      )}
    </div>
  );
}
