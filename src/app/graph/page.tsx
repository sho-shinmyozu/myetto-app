"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type Record = {
  id: string;
  recordDate: string;
  weightKg: number | null;
};

const PERIODS = [
  { key: "1w", label: "1週間" },
  { key: "1m", label: "1ヶ月" },
  { key: "3m", label: "3ヶ月" },
  { key: "1y", label: "1年" },
];

export default function GraphPage() {
  const router = useRouter();
  const [period, setPeriod] = useState("1m");
  const [records, setRecords] = useState<Record[]>([]);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/body-records?period=${period}`)
      .then((r) => r.json())
      .then((data) => setRecords(data.records ?? []));

    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => setTargetWeight(data.user?.targetWeightKg ?? null));
  }, [period]);

  const chartData = records
    .filter((r) => r.weightKg !== null)
    .map((r) => ({
      date: format(new Date(r.recordDate), period === "1y" ? "M/d" : "M/d", { locale: ja }),
      weight: r.weightKg,
    }));

  const weights = chartData.map((d) => d.weight as number);
  const minWeight = weights.length > 0 ? Math.floor(Math.min(...weights) - 1) : 40;
  const maxWeight = weights.length > 0 ? Math.ceil(Math.max(...weights) + 1) : 80;

  return (
    <div className="flex flex-col min-h-svh">
      <header className="sticky top-0 z-10 bg-white border-b border-pink-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 p-1">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-700 text-lg">📈 体重グラフ</h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Period selector */}
        <div className="flex gap-2 bg-pink-50 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p.key
                  ? "bg-white text-pink-500 shadow-sm"
                  : "text-gray-400"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Graph */}
        <div className="card">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fde0eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#aaa" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[minWeight, maxWeight]}
                  tick={{ fontSize: 11, fill: "#aaa" }}
                  unit="kg"
                />
                <Tooltip
                  formatter={(val) => [`${val} kg`, "体重"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #fde0eb",
                    fontSize: "12px",
                  }}
                />
                {targetWeight && (
                  <ReferenceLine
                    y={targetWeight}
                    stroke="#f05a9e"
                    strokeDasharray="4 4"
                    label={{
                      value: `目標 ${targetWeight}kg`,
                      fill: "#f05a9e",
                      fontSize: 11,
                      position: "insideTopRight",
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#f05a9e"
                  strokeWidth={2.5}
                  dot={{ fill: "#f9a8d4", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#f05a9e" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-gray-300">
              <p className="text-4xl mb-2">📊</p>
              <p className="text-sm">データがありません</p>
              <p className="text-xs mt-1">カラダ記録から体重を入力してください</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {chartData.length >= 2 && (
          <div className="card">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-400">最新</p>
                <p className="text-lg font-bold text-gray-700">
                  {chartData[chartData.length - 1].weight} kg
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">期間変化</p>
                <p
                  className={`text-lg font-bold ${
                    (chartData[chartData.length - 1].weight as number) <
                    (chartData[0].weight as number)
                      ? "text-pink-500"
                      : "text-red-400"
                  }`}
                >
                  {(
                    (chartData[chartData.length - 1].weight as number) -
                    (chartData[0].weight as number)
                  ).toFixed(1)}{" "}
                  kg
                </p>
              </div>
              {targetWeight && (
                <div>
                  <p className="text-xs text-gray-400">目標まで</p>
                  <p className="text-lg font-bold text-pink-400">
                    {(
                      (chartData[chartData.length - 1].weight as number) - targetWeight
                    ).toFixed(1)}{" "}
                    kg
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
