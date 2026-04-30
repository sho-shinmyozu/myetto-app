"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import SideMenu from "@/components/SideMenu";

type DashboardData = {
  user: { nickname: string; weightKg: number; targetWeightKg: number };
  goal: { dailyCalorieTarget: number; breakfastCalories: number; lunchCalories: number; dinnerCalories: number; snackCalories: number };
  today: {
    totalCalories: number;
    remainingCalories: number;
    meals: Record<string, number>;
  };
  lastBodyRecord: { weightKg: number; recordDate: string } | null;
  todayBodyRecord: { weightKg: number } | null;
};

const MOTIVATION_MESSAGES = [
  "今日もがんばろう！あなたならできる💪",
  "継続は力なり！一歩一歩着実に🌸",
  "今日の頑張りが明日の自分を作るよ✨",
  "体を大切に、美しく健康的に🌿",
  "目標に向かって、今日も一緒に頑張ろう🎯",
];

export default function DashboardPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [data, setData] = useState<DashboardData | null>(null);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [message] = useState(
    MOTIVATION_MESSAGES[Math.floor(Math.random() * MOTIVATION_MESSAGES.length)]
  );

  const fetchDashboard = useCallback(async (date: Date) => {
    const res = await fetch(`/api/dashboard?date=${format(date, "yyyy-MM-dd")}`);
    if (res.ok) {
      setData(await res.json());
    }
  }, []);

  useEffect(() => {
    fetchDashboard(selectedDate);
  }, [selectedDate, fetchDashboard]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(subDays(new Date(), 3), i);
    return d;
  });

  const caloriePct = data
    ? Math.min(100, (data.today.totalCalories / data.goal.dailyCalorieTarget) * 100)
    : 0;

  const isOver = data ? data.today.totalCalories > data.goal.dailyCalorieTarget : false;

  return (
    <div className="flex flex-col min-h-svh">
      {/* Side Menu */}
      <SideMenu open={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />
      {sideMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20"
          onClick={() => setSideMenuOpen(false)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-pink-100 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setSideMenuOpen(true)} className="p-1 text-gray-500">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <p className="text-sm font-semibold text-gray-600">
            {format(selectedDate, "yyyy年M月d日 (EEEE)", { locale: ja })}
          </p>
          <div className="w-8" />
        </div>

        {/* Week Strip */}
        <div className="flex justify-between gap-1">
          {weekDays.map((d) => {
            const isSelected =
              format(d, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
            const isToday =
              format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDate(startOfDay(d))}
                className={`flex flex-col items-center flex-1 py-1.5 rounded-xl text-xs transition-all ${
                  isSelected
                    ? "text-white"
                    : isToday
                    ? "text-pink-500"
                    : "text-gray-400"
                }`}
                style={
                  isSelected
                    ? { background: "linear-gradient(135deg, #f9a8d4, #f05a9e)" }
                    : {}
                }
              >
                <span>{format(d, "EEE", { locale: ja })}</span>
                <span className={`font-bold ${isSelected ? "" : "mt-0.5"}`}>
                  {format(d, "d")}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-8">
        {/* Character + Bubble */}
        <div className="flex items-end gap-3">
          <Image
            src="/png/mymelody1.PNG"
            alt="myetto"
            width={72}
            height={72}
            className="rounded-full flex-shrink-0"
            style={{ objectFit: "cover" }}
          />
          <div className="relative bg-white border-2 border-pink-200 rounded-2xl rounded-bl-sm px-4 py-2.5 flex-1">
            <p className="text-sm text-gray-700 font-medium">{message}</p>
          </div>
        </div>

        {/* Calorie Progress */}
        <div className="card">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm font-semibold text-gray-600">本日のカロリー</span>
            <span className={`text-xs ${isOver ? "text-red-400" : "text-gray-400"}`}>
              目標 {data?.goal.dailyCalorieTarget.toLocaleString() ?? "---"} kcal
            </span>
          </div>

          <div className="flex items-baseline gap-1 mb-2">
            <span className={`text-3xl font-bold ${isOver ? "text-red-400" : "text-pink-500"}`}>
              {data?.today.totalCalories.toLocaleString() ?? "0"}
            </span>
            <span className="text-sm text-gray-400">kcal</span>
          </div>

          <div className="w-full h-4 bg-pink-50 rounded-full overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${caloriePct}%`,
                background: isOver
                  ? "linear-gradient(90deg, #f9a8d4, #f87171)"
                  : "linear-gradient(90deg, #f9a8d4, #f05a9e)",
              }}
            />
          </div>

          <p className={`text-xs ${isOver ? "text-red-400" : "text-gray-400"}`}>
            {isOver
              ? `⚠️ ${(data!.today.totalCalories - data!.goal.dailyCalorieTarget).toLocaleString()} kcal オーバー`
              : `残り ${data?.today.remainingCalories.toLocaleString() ?? "---"} kcal`}
          </p>

          {/* PFC mini */}
          {data && (
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-pink-50 text-center">
              {[
                { label: "たんぱく質", val: data.today.totalCalories > 0 ? "記録済" : "-" },
                { label: "脂質", val: data.today.totalCalories > 0 ? "記録済" : "-" },
                { label: "炭水化物", val: data.today.totalCalories > 0 ? "記録済" : "-" },
              ].map((n) => (
                <div key={n.label}>
                  <p className="text-xs text-gray-400">{n.label}</p>
                  <p className="text-sm font-semibold text-gray-600">{n.val}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meal Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { type: "body", label: "カラダ記録", emoji: "⚖️", path: "/body-record", goal: null },
            { type: "breakfast", label: "朝食", emoji: "🌅", path: "/meal/breakfast", goal: data?.goal.breakfastCalories },
            { type: "lunch", label: "昼食", emoji: "☀️", path: "/meal/lunch", goal: data?.goal.lunchCalories },
            { type: "dinner", label: "夕食", emoji: "🌙", path: "/meal/dinner", goal: data?.goal.dinnerCalories },
            { type: "snack", label: "間食", emoji: "🍪", path: "/meal/snack", goal: data?.goal.snackCalories },
          ].map((card) => {
            const isBodyCard = card.type === "body";
            const eaten = !isBodyCard ? data?.today.meals[card.type] ?? 0 : null;
            const hasEntry = eaten !== null && eaten > 0;
            const bodyWeight = isBodyCard ? data?.todayBodyRecord?.weightKg ?? null : null;

            return (
              <button
                key={card.type}
                onClick={() =>
                  router.push(`${card.path}?date=${format(selectedDate, "yyyy-MM-dd")}`)
                }
                className="card text-left hover:border-pink-300 border-2 border-transparent transition-all active:scale-95"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{card.emoji}</span>
                  <span className="text-sm font-semibold text-gray-700">{card.label}</span>
                </div>
                {isBodyCard ? (
                  <div>
                    <p className={`text-lg font-bold ${bodyWeight !== null ? "text-pink-500" : "text-gray-300"}`}>
                      {bodyWeight !== null ? `${bodyWeight} kg` : "未記録"}
                    </p>
                  </div>
                ) : eaten !== null ? (
                  <div>
                    <p className={`text-lg font-bold ${hasEntry ? "text-pink-500" : "text-gray-300"}`}>
                      {hasEntry ? `${eaten.toLocaleString()} kcal` : "未記録"}
                    </p>
                    {card.goal && (
                      <p className="text-xs text-gray-400">目標 {card.goal.toLocaleString()} kcal</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">タップして記録</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Weight Card */}
        {data?.lastBodyRecord && (
          <div className="card flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div className="flex-1">
              <p className="text-xs text-gray-400">最新体重</p>
              <p className="text-xl font-bold text-gray-700">
                {data.lastBodyRecord.weightKg} kg
              </p>
              <p className="text-xs text-gray-400">
                目標まで{" "}
                <span className="text-pink-500 font-semibold">
                  {(data.lastBodyRecord.weightKg - (data.user.targetWeightKg ?? 0)).toFixed(1)} kg
                </span>
              </p>
            </div>
            <button
              onClick={() => router.push("/graph")}
              className="text-xs text-pink-400 border border-pink-200 rounded-full px-3 py-1"
            >
              グラフ
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
