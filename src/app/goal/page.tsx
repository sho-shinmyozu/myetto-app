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
  } | null;
  goal: {
    dailyCalorieTarget: number;
    breakfastCalories: number;
    lunchCalories: number;
    dinnerCalories: number;
    snackCalories: number;
    targetDate: string;
  } | null;
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
        {/* Goal Settings */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">目標設定</h2>
          <InfoRow
            label="目的"
            value={u?.goalType ? (GOAL_TYPE_LABELS[u.goalType] ?? u.goalType) : "---"}
          />
          <InfoRow
            label="目標体重"
            value={u?.targetWeightKg != null ? `${u.targetWeightKg} kg` : "---"}
          />
          <InfoRow
            label="ペース"
            value={u?.paceType ? (PACE_LABELS[u.paceType] ?? u.paceType) : "---"}
          />
          <InfoRow
            label="減量アプローチ"
            value={u?.approachType ? (APPROACH_LABELS[u.approachType] ?? u.approachType) : "---"}
          />
        </div>

        {/* Active Goal from UserGoal */}
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
            {g.targetDate && (
              <InfoRow
                label="目標達成予定"
                value={format(new Date(g.targetDate), "yyyy年M月d日", { locale: ja })}
              />
            )}
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
