"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import SideMenu from "@/components/SideMenu";

type GoalData = {
  user: {
    goalType: string | null;
    targetWeightKg: number | null;
    paceType: string | null;
    approachType: string | null;
    weightKg: number | null;
  } | null;
  goal: {
    dailyCalorieTarget: number;
    breakfastCalories: number;
    lunchCalories: number;
    dinnerCalories: number;
    snackCalories: number;
    targetDate: string;
  } | null;
  lastBodyRecord: { weightKg: number | null; recordDate: string } | null;
};

const GOAL_TYPE_LABELS: Record<string, string> = {
  diet: "🍎 ダイエット",
  health: "💪 健康管理",
  muscle: "🏋️ 筋トレ・ボディメイク",
};

const PACE_LABELS: Record<string, string> = {
  soft: "🐢 ソフト（月 0.5kg）",
  hard: "🔥 ハード（月 1.0kg）",
};

const APPROACH_LABELS: Record<string, string> = {
  diet_only: "🥗 食事中心",
  diet_exercise: "🥗+🏃 食事と運動",
  exercise_only: "🏃 運動中心",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-pink-50 last:border-none">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-700">{value}</span>
    </div>
  );
}

export default function GoalPage() {
  const router = useRouter();
  const [data, setData] = useState<GoalData | null>(null);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/goal")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const u = data?.user;
  const g = data?.goal;

  // 現在体重: 最新BodyRecord → なければ user.weightKg
  const currentWeight =
    data?.lastBodyRecord?.weightKg ?? u?.weightKg ?? null;
  // 開始体重: onboarding時に入力した user.weightKg
  const startWeight = u?.weightKg ?? null;
  const targetWeight = u?.targetWeightKg ?? null;

  const diff =
    currentWeight != null && targetWeight != null
      ? currentWeight - targetWeight
      : null;

  const progress =
    startWeight != null &&
    currentWeight != null &&
    targetWeight != null &&
    startWeight !== targetWeight
      ? Math.min(
          100,
          Math.max(
            0,
            ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100
          )
        )
      : null;

  return (
    <div className="flex flex-col min-h-svh bg-gray-50">
      <SideMenu open={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />
      {sideMenuOpen && (
        <div className="fixed inset-0 bg-black/30 z-20" onClick={() => setSideMenuOpen(false)} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-pink-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setSideMenuOpen(true)} className="p-1 text-gray-500">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-gray-700">目標の確認</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-8">
        {/* ── 体重メインカード ── */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">体重の進捗</h2>

          {/* 現在体重 / 目標体重 */}
          <div className="flex items-end justify-around mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">現在体重</p>
              <p className="text-4xl font-bold text-pink-500">
                {currentWeight != null ? currentWeight.toFixed(1) : "---"}
              </p>
              <p className="text-sm text-gray-400">kg</p>
            </div>
            <div className="text-center pb-1">
              <svg width="20" height="20" fill="none" stroke="#f9a8d4" strokeWidth="2">
                <path d="M5 10h10M13 7l3 3-3 3" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">目標体重</p>
              <p className="text-4xl font-bold text-gray-400">
                {targetWeight != null ? targetWeight.toFixed(1) : "---"}
              </p>
              <p className="text-sm text-gray-400">kg</p>
            </div>
          </div>

          {/* プログレスバー */}
          {progress != null && (
            <div className="mb-3">
              <div className="w-full h-3 bg-pink-50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #f9a8d4, #f05a9e)",
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">
                達成率 {progress.toFixed(0)}%
              </p>
            </div>
          )}

          {/* 差分 */}
          <div className="flex justify-around pt-3 border-t border-pink-50">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-0.5">あと</p>
              <p className={`text-2xl font-bold ${diff != null && diff <= 0 ? "text-green-400" : "text-pink-500"}`}>
                {diff != null
                  ? diff <= 0
                    ? "達成！"
                    : `${diff.toFixed(1)} kg`
                  : "---"}
              </p>
            </div>
            {startWeight != null && (
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">スタート体重</p>
                <p className="text-2xl font-bold text-gray-400">
                  {startWeight.toFixed(1)} kg
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── 目標設定 ── */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">目標設定</h2>
          <InfoRow
            label="目的"
            value={u?.goalType ? (GOAL_TYPE_LABELS[u.goalType] ?? u.goalType) : "---"}
          />
          <InfoRow
            label="ペース"
            value={u?.paceType ? (PACE_LABELS[u.paceType] ?? u.paceType) : "---"}
          />
          <InfoRow
            label="アプローチ"
            value={u?.approachType ? (APPROACH_LABELS[u.approachType] ?? u.approachType) : "---"}
          />
          {g?.targetDate && (
            <InfoRow
              label="目標達成予定"
              value={format(new Date(g.targetDate), "yyyy年M月d日", { locale: ja })}
            />
          )}
        </div>

        {/* ── カロリー目標 ── */}
        {g && (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">カロリー目標</h2>
            <InfoRow
              label="1日の目標"
              value={`${g.dailyCalorieTarget.toLocaleString()} kcal`}
            />
            <InfoRow label="朝食" value={`${g.breakfastCalories} kcal`} />
            <InfoRow label="昼食" value={`${g.lunchCalories} kcal`} />
            <InfoRow label="夕食" value={`${g.dinnerCalories} kcal`} />
            <InfoRow label="間食" value={`${g.snackCalories} kcal`} />
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => router.push("/goal/edit")}
          className="btn-primary w-full"
        >
          目標を更新する
        </button>
      </main>
    </div>
  );
}
