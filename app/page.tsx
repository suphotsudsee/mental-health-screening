import Link from "next/link";

export default function HomePage() {
  return (
    <div className="p-5 space-y-5">
      <header className="text-center">
        <h1 className="text-2xl font-bold mb-1">
          ระบบคัดกรองสุขภาพจิต
        </h1>
        <p className="text-sm text-gray-600">
          แบบประเมินความเครียด & 2Q plus & 8Q
        </p>
      </header>

      <div className="space-y-3">
        <Link
          href="/assess"
          className="block w-full p-4 rounded-lg bg-emerald-600 text-white text-center font-semibold"
        >
          เริ่มทำแบบประเมิน
        </Link>

        <Link
          href="/history"
          className="block w-full p-3 rounded-lg bg-slate-100 text-center"
        >
          ดูประวัติการคัดกรอง
        </Link>

        <Link
          href="/dashboard"
          className="block w-full p-3 rounded-lg bg-slate-100 text-center"
        >
          Dashboard สำหรับผู้บริหาร
        </Link>
      </div>

      <footer className="mt-10 text-center text-xs text-gray-400">
        กลุ่มงานสุขภาพจิต / กลุ่มงานสุขภาพดิจิทัล – ใช้เพื่อการสาธารณสุข<br />
        #สำนักงานสาธารรณสุขจังหวัดอุบลราชธานี
      </footer>
    </div>
  );
}
