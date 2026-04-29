"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ja } from "date-fns/locale";

type Summary = {
  summaryDate: string;
  totalCalories: number;
  calorieGoal: number;
  isGoalAchieved: boolean;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [summaries, setSummaries] = useState<Summary[]>([]);

  useEffect(() => {
    const monthStr = format(currentMonth, "yyyy-MM");
    fetch(`/api/calendar?month=${monthStr}`)
      .then((r) => r.json())
      .then((data) => setSummaries(data.summaries ?? []));
  }, [currentMonth]);

  const summaryMap = new Map(
    summaries.map((s) => [s.summaryDate.split("T")[0], s])
  );

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDow = getDay(startOfMonth(currentMonth));
  const blanks = Array(firstDow).fill(null);

  return (
    <div className="flex flex-col min-h-svh">
      <header className="sticky top-0 z-10 bg-white border-b border-pink-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 p-1">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-700 text-lg">📅 カレンダー</h1>
      </header>

      <div className="px-4 py-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 text-gray-400"
          >
            ‹
          </button>
          <h2 className="font-bold text-gray-700">
            {format(currentMonth, "yyyy年M月", { locale: ja })}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 text-gray-400"
          >
            ›
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-medium py-1 ${
                i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const summary = summaryMap.get(dateStr);
            const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
            const dow = getDay(day);

            return (
              <button
                key={dateStr}
                onClick={() => router.push(`/dashboard?date=${dateStr}`)}
                className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${
                  isToday ? "bg-pink-50 ring-1 ring-pink-300" : "hover:bg-pink-50"
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    dow === 0
                      ? "text-red-400"
                      : dow === 6
                      ? "text-blue-400"
                      : isToday
                      ? "text-pink-500"
                      : "text-gray-600"
                  }`}
                >
                  {format(day, "d")}
                </span>

                {summary ? (
                  summary.isGoalAchieved ? (
                    <Image
                      src="/png/mymelody2.PNG"
                      alt="達成"
                      width={28}
                      height={28}
                      className="rounded-full mt-0.5"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <Image
                      src="/png/pig.PNG"
                      alt="オーバー"
                      width={28}
                      height={28}
                      className="rounded-full mt-0.5"
                      style={{ objectFit: "cover" }}
                    />
                  )
                ) : (
                  <div className="w-7 h-7 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 card">
          <p className="text-xs font-semibold text-gray-500 mb-3">スタンプの意味</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/png/mymelody2.PNG"
                alt="達成"
                width={28}
                height={28}
                className="rounded-full"
                style={{ objectFit: "cover" }}
              />
              <span className="text-xs text-gray-600">カロリー目標達成</span>
            </div>
            <div className="flex items-center gap-2">
              <Image
                src="/png/pig.PNG"
                alt="オーバー"
                width={28}
                height={28}
                className="rounded-full"
                style={{ objectFit: "cover" }}
              />
              <span className="text-xs text-gray-600">カロリーオーバー</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {summaries.length > 0 && (
          <div className="mt-3 card">
            <p className="text-xs font-semibold text-gray-500 mb-3">今月の成績</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-pink-500">
                  {summaries.filter((s) => s.isGoalAchieved).length}
                </p>
                <p className="text-xs text-gray-400">目標達成日</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-400">
                  {summaries.filter((s) => !s.isGoalAchieved).length}
                </p>
                <p className="text-xs text-gray-400">オーバー日</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">
                  {summaries.length > 0
                    ? Math.round(
                        (summaries.filter((s) => s.isGoalAchieved).length / summaries.length) * 100
                      )
                    : 0}%
                </p>
                <p className="text-xs text-gray-400">達成率</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
