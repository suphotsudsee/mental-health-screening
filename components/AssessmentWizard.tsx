"use client";

import { useState } from "react";
import jsPDF from "jspdf";

const stressOptions = [
  { v: 1, label: "1. ไม่เครียด 😊" },
  { v: 2, label: "2. เครียดน้อย 🙂" },
  { v: 3, label: "3. ปานกลาง 😐" },
  { v: 4, label: "4. มาก 😟" },
  { v: 5, label: "5. มากที่สุด 😭" }
];

export default function AssessmentWizard() {
  const [step, setStep] = useState("stress"); // stress | twoq | eightq | result
  const [citizenId, setCitizenId] = useState("");
  const [fullname, setFullname] = useState("");
  const [facilityCode, setFacilityCode] = useState("");

  const [stressScore, setStressScore] = useState(null);
  const [twoq, setTwoq] = useState({ q1: 0, q2: 0, q3: 0 });
  const [answers8q, setAnswers8q] = useState(Array(8).fill(0));
  const [q8Total, setQ8Total] = useState(0);
  const [riskResult, setRiskResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const update8q = (idx, v) => {
    const arr = [...answers8q];
    arr[idx] = v;
    setAnswers8q(arr);
    setQ8Total(arr.reduce((a, b) => a + b, 0));
  };

  const computeRisk = async () => {
    let level = "none";
    let recommendation =
      "ไม่พบความเสี่ยงด้านสุขภาพจิตที่ชัดเจน แนะนำดูแลตนเองและติดตามอาการตามความเหมาะสม";

    if (stressScore && stressScore >= 4) {
      level = "low";
      recommendation =
        "เครียดระดับเสี่ยง แนะนำให้คำปรึกษาสั้น ๆ / จัดกิจกรรมส่งเสริมสุขภาพจิต และนัดติดตามภายใน 1 เดือน";
    }

    const twoqPositive = [twoq.q1, twoq.q2].some((v) => v === 1);

    if (twoqPositive && twoq.q3 === 0 && level !== "high") {
      level = "low";
      recommendation =
        "เสี่ยงซึมเศร้าระดับน้อยถึงปานกลาง ให้ PSYCHO-EDUCATION / COUNSELLING และนัดติดตามทุก 1 เดือน อย่างน้อย 1 ปี พร้อมจัด Buddy คอยเฝ้าระวัง";
    }

    if (twoq.q3 === 1) {
      if (q8Total === 0) {
        level = "low";
        recommendation =
          "มีความคิดอยากตายแต่คะแนน 8Q รวม 0 แนะนำติดตามใกล้ชิด จัดผู้ดูแล/เพื่อนช่วยเพื่อน (Buddy) และนัดติดตามสม่ำเสมอ";
      } else if (q8Total >= 1 && q8Total <= 8) {
        level = "medium";
        recommendation =
          "พบความเสี่ยงฆ่าตัวตายระดับปานกลาง ควรส่งพบแพทย์ / จิตแพทย์เพื่อประเมินอย่างละเอียด วางแผนรักษา และกำหนดการติดตาม";
      } else if (q8Total >= 9) {
        level = "high";
        recommendation =
          "พบความเสี่ยงฆ่าตัวตายระดับรุนแรง ให้ส่งต่อโรงพยาบาลทันที จัดระบบเฝ้าระวังใกล้ชิดตลอด 24 ชั่วโมง และดูแลความปลอดภัยอย่างเคร่งครัด";
      }
    }

    const result = {
      citizen_id: citizenId || null,
      fullname: fullname || null,
      facility_code: facilityCode || null,
      stress_score: stressScore,
      q1: twoq.q1,
      q2: twoq.q2,
      q3: twoq.q3,
      q8_total: q8Total,
      risk_level: level,
      recommendation
    };

    setRiskResult(result);
    setStep("result");

    // บันทึกลงฐานข้อมูล + แจ้ง LINE (เฉพาะ medium/high)
    try {
      setSaving(true);
      await fetch("/api/screenings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result)
      });

      if (level === "medium" || level === "high") {
        await fetch("/api/line-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text:
              `แจ้งเตือนความเสี่ยงฆ่าตัวตายระดับ ${level.toUpperCase()}\n` +
              `ชื่อ: ${fullname || "-"}\n` +
              `คะแนน 8Q: ${q8Total}`
          })
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = () => {
    if (!riskResult) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("แบบประเมินสุขภาพจิต (Stress / 2Q plus / 8Q)", 10, 20);

    doc.setFontSize(12);
    if (riskResult.fullname) {
      doc.text(`ชื่อ: ${riskResult.fullname}`, 10, 30);
    }
    if (riskResult.citizen_id) {
      doc.text(`รหัส: ${riskResult.citizen_id}`, 10, 36);
    }

    doc.text(`คะแนนความเครียด: ${riskResult.stress_score ?? "-"}`, 10, 48);
    doc.text(
      `2Q: Q1=${riskResult.q1} Q2=${riskResult.q2} Q3=${riskResult.q3}`,
      10,
      56
    );
    doc.text(`คะแนนรวม 8Q: ${riskResult.q8_total}`, 10, 64);
    doc.text(`ระดับความเสี่ยง: ${riskResult.risk_level}`, 10, 72);

    doc.text("ข้อเสนอแนะ:", 10, 86);
    const split = doc.splitTextToSize(riskResult.recommendation, 180);
    doc.text(split, 10, 94);

    doc.save("screening.pdf");
  };

  // ---------------- UI -----------------

  if (step === "stress") {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-center mb-1">
          แบบประเมินระดับความเครียด
        </h1>

        <div className="bg-slate-50 p-3 rounded-md space-y-2 text-sm">
          <div>
            <label className="block mb-1">รหัส / เลขบัตร / HN (ถ้ามี)</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={citizenId}
              onChange={(e) => setCitizenId(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1">ชื่อ-สกุล (ถ้าต้องการบันทึก)</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1">รหัสหน่วยบริการ</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={facilityCode}
              onChange={(e) => setFacilityCode(e.target.value)}
            />
          </div>
        </div>

        <p className="text-sm text-gray-600">
          ขอให้เลือกระดับความเครียดของท่านในช่วง 2 สัปดาห์ที่ผ่านมา
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
    const setAns = (key, v) => setTwoq({ ...twoq, [key]: v });

    const goNext = () => {
      if (twoq.q3 === 1) setStep("eightq");
      else computeRisk();
    };

    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-center">แบบประเมิน 2Q plus</h1>

        {[
          ["q1", "ใน 2 สัปดาห์ที่ผ่านมา ท่านรู้สึกไม่สบายใจ ซึม เศร้า หงอย หรือไม่?"],
          ["q2", "ใน 2 สัปดาห์ที่ผ่านมา ท่านรู้สึกเบื่อ ไม่สนุกกับสิ่งที่เคยชอบหรือไม่?"],
          ["q3", "ใน 1 เดือนที่ผ่านมา ท่านมีความคิดไม่อยากมีชีวิตอยู่ หรืออยากตายหรือไม่?"]
        ].map(([key, text]) => (
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

        {[...Array(8).keys()].map((i) => (
          <div key={i} className="space-y-1">
            <p>คำถามที่ {i + 1}</p>
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

        <button
          onClick={computeRisk}
          className="w-full p-3 rounded bg-emerald-700 text-white"
        >
          ดูผลประเมิน
        </button>
      </div>
    );
  }

  // RESULT
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-center">สรุปผลการประเมิน</h1>

      {riskResult && (
        <>
          <div className="bg-yellow-50 p-3 rounded text-sm space-y-1">
            {riskResult.fullname && (
              <p>ชื่อ: {riskResult.fullname}</p>
            )}
            {riskResult.citizen_id && <p>รหัส: {riskResult.citizen_id}</p>}
            <p>คะแนนความเครียด: {riskResult.stress_score ?? "-"}</p>
            <p>
              2Q: Q1={riskResult.q1} Q2={riskResult.q2} Q3={riskResult.q3}
            </p>
            <p>คะแนนรวม 8Q: {riskResult.q8_total}</p>
            <p>
              ระดับความเสี่ยง:{" "}
              <b>
                {riskResult.risk_level === "none"
                  ? "ไม่เสี่ยง"
                  : riskResult.risk_level === "low"
                  ? "เสี่ยงน้อย"
                  : riskResult.risk_level === "medium"
                  ? "เสี่ยงปานกลาง"
                  : "เสี่ยงรุนแรง"}
              </b>
            </p>
          </div>

          <div className="bg-emerald-50 p-3 rounded text-sm">
            <b>แนวทางการดูแล:</b>
            <p>{riskResult.recommendation}</p>
          </div>

          <button
            onClick={exportPDF}
            className="w-full p-3 rounded bg-blue-600 text-white"
          >
            Export เป็น PDF
          </button>

          <button
            onClick={() => window.location.assign("/")}
            className="w-full p-3 rounded bg-slate-100 text-center mt-2"
          >
            กลับหน้าแรก
          </button>

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
