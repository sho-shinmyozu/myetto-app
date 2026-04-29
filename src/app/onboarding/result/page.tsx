"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";

function ResultContent() {
  const params = useSearchParams();
  const router = useRouter();

  const dailyCalorie = params.get("dailyCalorie") ?? "1800";
  const targetDate = params.get("targetDate") ?? "";
  const daysToGoal = params.get("daysToGoal") ?? "90";
  const steps = params.get("steps") ?? "8000";
  const tdee = params.get("tdee") ?? "2000";
  const breakfast = params.get("breakfast") ?? "500";
  const lunch = params.get("lunch") ?? "600";
  const dinner = params.get("dinner") ?? "500";

  const targetDateObj = targetDate ? new Date(targetDate) : null;
  const formattedDate = targetDateObj
    ? `${targetDateObj.getFullYear()}年${targetDateObj.getMonth() + 1}月${targetDateObj.getDate()}日`
    : "";

  const snack = Math.max(0, parseInt(dailyCalorie) - parseInt(breakfast) - parseInt(lunch) - parseInt(dinner));

  return (
    <div className="min-h-svh flex flex-col px-6 py-8">
      <div className="flex flex-col items-center mb-6">
        <Image
          src="/png/mymelody1.PNG"
          alt="myetto"
          width={80}
          height={80}
          className="rounded-full mb-3"
          style={{ objectFit: "cover" }}
        />
        <div className="bg-pink-50 border border-pink-200 rounded-2xl px-4 py-2 relative">
          <p className="text-sm text-pink-600 font-medium">
            目標を設定したよ！一緒にがんばろう✨
          </p>
        </div>
      </div>

      <h1 className="text-xl font-bold text-gray-700 mb-4">あなたの目標プラン</h1>

      <div className="space-y-3">
        <div className="card">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-xs text-gray-400">目標達成予定日</p>
              <p className="text-lg font-bold text-pink-500">{formattedDate}</p>
              <p className="text-xs text-gray-400">約 {daysToGoal} 日後</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🍽️</span>
            <div>
              <p className="text-xs text-gray-400">1日の摂取カロリー目標</p>
              <p className="text-2xl font-bold text-pink-500">
                {parseInt(dailyCalorie).toLocaleString()} <span className="text-base">kcal</span>
              </p>
              <p className="text-xs text-gray-400">推定消費 {parseInt(tdee).toLocaleString()} kcal</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center border-t border-pink-50 pt-3">
            {[
              { label: "朝食", cal: breakfast, emoji: "🌅" },
              { label: "昼食", cal: lunch, emoji: "☀️" },
              { label: "夕食", cal: dinner, emoji: "🌙" },
              { label: "間食", cal: snack.toString(), emoji: "🍪" },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-lg">{m.emoji}</p>
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className="text-sm font-bold text-gray-700">{parseInt(m.cal).toLocaleString()}</p>
                <p className="text-xs text-gray-400">kcal</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👟</span>
            <div>
              <p className="text-xs text-gray-400">1日の目標歩数</p>
              <p className="text-xl font-bold text-pink-500">
                {parseInt(steps).toLocaleString()} <span className="text-base">歩</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          className="btn-primary"
          onClick={() => router.push("/dashboard")}
        >
          はじめる 🚀
        </button>
      </div>
    </div>
  );
}

export default function OnboardingResultPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-svh">計算中...</div>}>
      <ResultContent />
    </Suspense>
  );
}
