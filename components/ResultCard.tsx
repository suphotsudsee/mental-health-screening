type ResultItem = {
  label: string;
  score: number;
  level: string;
  recommendation: string;
};

type ResultCardProps = {
  items: ResultItem[];
};

export default function ResultCard({ items }: ResultCardProps) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-emerald-900">สรุปผลเบื้องต้น</h3>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white bg-white/80 p-4 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{item.label}</span>
              <span className="font-semibold text-slate-900">คะแนน {item.score}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-emerald-800">ระดับ: {item.level}</p>
            <p className="text-sm text-slate-700">{item.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
