"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { format, addDays, subDays, startOfDay, differenceInDays } from "date-fns";
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

// 今日を基点に60日間（スクロール用）- モジュールロード時に固定
const _stripBase = startOfDay(new Date());
const ALL_STRIP_DAYS = Array.from({ length: 60 }, (_, i) =>
  addDays(subDays(_stripBase, 30), i)
);
const STRIP_GAP = 4; // gap-1 = 4px

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    dateParam ? startOfDay(new Date(dateParam)) : startOfDay(new Date())
  );

  const [data, setData] = useState<DashboardData | null>(null);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [message] = useState(
    MOTIVATION_MESSAGES[Math.floor(Math.random() * MOTIVATION_MESSAGES.length)]
  );

  // スクロール制御用
  const stripRef       = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programRef     = useRef(false); // プログラム的スクロール中は true
  const fromScrollRef  = useRef(false); // スクロールで日付更新したとき true
  const isInitialRef   = useRef(true);

  const fetchDashboard = useCallback(async (date: Date) => {
    const res = await fetch(`/api/dashboard?date=${format(date, "yyyy-MM-dd")}`);
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    fetchDashboard(selectedDate);
  }, [selectedDate, fetchDashboard]);

  // ── スクロール関連 ───────────────────────────────────────────────────────────

  const scrollToDate = useCallback((d: Date, smooth: boolean) => {
    if (!stripRef.current) return;
    const container = stripRef.current;
    const dayW = (container.clientWidth - STRIP_GAP * 6) / 7;
    const dayIdx = differenceInDays(d, ALL_STRIP_DAYS[0]);
    const targetLeft = dayIdx * (dayW + STRIP_GAP) - container.clientWidth / 2 + dayW / 2;
    programRef.current = true;
    if (smooth) {
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
    } else {
      container.scrollLeft = Math.max(0, targetLeft);
    }
    setTimeout(() => { programRef.current = false; }, smooth ? 500 : 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // selectedDate が変わったら strip をスクロール
  useEffect(() => {
    if (fromScrollRef.current) { fromScrollRef.current = false; return; }
    scrollToDate(selectedDate, !isInitialRef.current);
    isInitialRef.current = false;
  }, [selectedDate, scrollToDate]);

  function handleStripScroll() {
    if (programRef.current) return;
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      if (!stripRef.current) return;
      const container = stripRef.current;
      const dayW = (container.clientWidth - STRIP_GAP * 6) / 7;
      const centerLeft = container.scrollLeft + container.clientWidth / 2;
      const dayIdx = Math.round((centerLeft - dayW / 2) / (dayW + STRIP_GAP));
      const clamped = Math.max(0, Math.min(ALL_STRIP_DAYS.length - 1, dayIdx));
      fromScrollRef.current = true;
      setSelectedDate(startOfDay(ALL_STRIP_DAYS[clamped]));
    }, 150);
  }

  // ── カロリー計算 ─────────────────────────────────────────────────────────────

  const caloriePct = data
    ? Math.min(100, (data.today.totalCalories / data.goal.dailyCalorieTarget) * 100)
    : 0;
  const isOver = data ? data.today.totalCalories > data.goal.dailyCalorieTarget : false;

  return (
    <div className="flex flex-col min-h-svh">
      <SideMenu open={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />
      {sideMenuOpen && (
        <div className="fixed inset-0 bg-black/30 z-20" onClick={() => setSideMenuOpen(false)} />
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

        {/* Week Strip — 60日スクロール */}
        <div
          ref={stripRef}
          className="flex overflow-x-auto"
          style={{ scrollbarWidth: "none", gap: `${STRIP_GAP}px` }}
          onScroll={handleStripScroll}
        >
          {ALL_STRIP_DAYS.map((d) => {
            const isSelected = format(d, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
            const isToday    = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            return (
              <button
                key={d.toISOString()}
                onClick={() => {
                  setSelectedDate(startOfDay(d));
                  scrollToDate(d, true);
                }}
                className={`flex flex-col items-center flex-shrink-0 py-1.5 rounded-xl text-xs transition-all ${
                  isSelected ? "text-white" : isToday ? "text-pink-500" : "text-gray-400"
                }`}
                style={{
                  width: `calc((100% - ${STRIP_GAP * 6}px) / 7)`,
                  ...(isSelected
                    ? { background: "linear-gradient(135deg, #f9a8d4, #f05a9e)" }
                    : {}),
                }}
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

          {data && (
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-pink-50 text-center">
              {[
                { label: "たんぱく質", val: data.today.totalCalories > 0 ? "記録済" : "-" },
                { label: "脂質",       val: data.today.totalCalories > 0 ? "記録済" : "-" },
                { label: "炭水化物",   val: data.today.totalCalories > 0 ? "記録済" : "-" },
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
            { type: "body",      label: "カラダ記録", emoji: "⚖️",  path: "/body-record",   goal: null },
            { type: "breakfast", label: "朝食",       emoji: "🌅",  path: "/meal/breakfast", goal: data?.goal.breakfastCalories },
            { type: "lunch",     label: "昼食",       emoji: "☀️",  path: "/meal/lunch",     goal: data?.goal.lunchCalories },
            { type: "dinner",    label: "夕食",       emoji: "🌙",  path: "/meal/dinner",    goal: data?.goal.dinnerCalories },
            { type: "snack",     label: "間食",       emoji: "🍪",  path: "/meal/snack",     goal: data?.goal.snackCalories },
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
                  <p className={`text-lg font-bold ${bodyWeight !== null ? "text-pink-500" : "text-gray-300"}`}>
                    {bodyWeight !== null ? `${bodyWeight} kg` : "未記録"}
                  </p>
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
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-svh">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
