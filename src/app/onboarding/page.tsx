"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormData = {
  gender: "male" | "female" | "";
  goalType: "diet" | "health" | "muscle" | "";
  birthDate: string;
  heightCm: string;
  weightKg: string;
  targetWeightKg: string;
  paceType: "hard" | "soft" | "";
  approachType: "diet_only" | "diet_exercise" | "exercise_only" | "";
};

const TOTAL_STEPS = 8;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    gender: "",
    goalType: "",
    birthDate: "",
    heightCm: "",
    weightKg: "",
    targetWeightKg: "",
    paceType: "",
    approachType: "",
  });

  function canNext() {
    if (step === 1) return form.gender !== "";
    if (step === 2) return form.goalType !== "";
    if (step === 3) return form.birthDate !== "";
    if (step === 4) return form.heightCm !== "" && form.weightKg !== "";
    if (step === 5) return form.targetWeightKg !== "";
    if (step === 6) return form.paceType !== "";
    if (step === 7) return form.approachType !== "";
    return true;
  }

  async function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gender: form.gender,
        goalType: form.goalType,
        birthDate: form.birthDate,
        heightCm: parseFloat(form.heightCm),
        weightKg: parseFloat(form.weightKg),
        targetWeightKg: parseFloat(form.targetWeightKg),
        paceType: form.paceType,
        approachType: form.approachType,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const params = new URLSearchParams({
        dailyCalorie: data.goals.dailyCalorieTarget,
        targetDate: data.goals.targetDate,
        daysToGoal: data.daysToGoal,
        steps: data.goals.dailyStepsTarget,
        tdee: data.goals.tdee,
        breakfast: data.goals.breakfastCalories,
        lunch: data.goals.lunchCalories,
        dinner: data.goals.dinnerCalories,
      });
      router.push(`/onboarding/result?${params}`);
    }
    setLoading(false);
  }

  const progressPct = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-svh flex flex-col px-6 py-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>STEP {step} / {TOTAL_STEPS}</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #f9a8d4, #f05a9e)",
            }}
          />
        </div>
      </div>

      <div className="flex-1">
        {step === 1 && (
          <StepCard title="あなたの性別を教えてください">
            <div className="flex gap-4 justify-center mt-4">
              {(["female", "male"] as const).map((g) => (
                <button
                  key={g}
                  className={`tag-button px-8 py-4 text-lg ${form.gender === g ? "selected" : ""}`}
                  onClick={() => setForm({ ...form, gender: g })}
                >
                  {g === "female" ? "👩 女性" : "👨 男性"}
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard title="あなたの目標を教えてください">
            <div className="flex flex-col gap-3 mt-4">
              {[
                { val: "diet", label: "🍎 ダイエット", desc: "体重を減らしたい" },
                { val: "health", label: "💪 健康管理", desc: "健康的な体を維持したい" },
                { val: "muscle", label: "🏋️ 筋トレ・ボディメイク", desc: "筋肉をつけたい" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  className={`tag-button text-left flex flex-col rounded-xl px-5 py-4 ${
                    form.goalType === opt.val ? "selected" : ""
                  }`}
                  onClick={() => setForm({ ...form, goalType: opt.val as FormData["goalType"] })}
                >
                  <span className="font-semibold">{opt.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {step === 3 && (
          <StepCard title="生年月日を教えてください">
            <div className="mt-4">
              <input
                type="date"
                className="input-field text-center text-lg"
                value={form.birthDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </div>
          </StepCard>
        )}

        {step === 4 && (
          <StepCard title="現在の身長・体重を入力してください">
            <div className="flex flex-col gap-4 mt-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">身長 (cm)</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.heightCm}
                  onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                  placeholder="160"
                  min="100"
                  max="250"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">体重 (kg)</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                  placeholder="60"
                  min="30"
                  max="300"
                  step="0.1"
                />
              </div>
            </div>
          </StepCard>
        )}

        {step === 5 && (
          <StepCard title="目標体重を入力してください">
            <div className="mt-4">
              <label className="block text-sm text-gray-500 mb-1">目標体重 (kg)</label>
              <input
                type="number"
                className="input-field"
                value={form.targetWeightKg}
                onChange={(e) => setForm({ ...form, targetWeightKg: e.target.value })}
                placeholder="55"
                min="30"
                max="300"
                step="0.1"
              />
              {form.weightKg && form.targetWeightKg && (
                <p className="text-sm text-pink-400 mt-2 text-center">
                  {(parseFloat(form.weightKg) - parseFloat(form.targetWeightKg)).toFixed(1)}kg 減量
                </p>
              )}
            </div>
          </StepCard>
        )}

        {step === 6 && (
          <StepCard title="1ヶ月のペースを選んでください">
            <div className="flex flex-col gap-4 mt-4">
              {[
                {
                  val: "soft",
                  label: "🐢 ソフト",
                  desc: "月 0.5kg ペース（無理なく続ける）",
                  badge: "おすすめ",
                },
                {
                  val: "hard",
                  label: "🔥 ハード",
                  desc: "月 1.0kg ペース（しっかり絞る）",
                  badge: null,
                },
              ].map((opt) => (
                <button
                  key={opt.val}
                  className={`tag-button text-left flex flex-col rounded-xl px-5 py-4 relative ${
                    form.paceType === opt.val ? "selected" : ""
                  }`}
                  onClick={() => setForm({ ...form, paceType: opt.val as FormData["paceType"] })}
                >
                  {opt.badge && (
                    <span className="absolute top-2 right-3 text-xs bg-pink-100 text-pink-500 px-2 py-0.5 rounded-full">
                      {opt.badge}
                    </span>
                  )}
                  <span className="font-semibold">{opt.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {step === 7 && (
          <StepCard title="減量アプローチを選んでください">
            <div className="flex flex-col gap-3 mt-4">
              {[
                { val: "diet_only", label: "🥗 食事中心", desc: "食事管理でコントロール" },
                {
                  val: "diet_exercise",
                  label: "🥗+🏃 食事と運動",
                  desc: "バランスよく取り組む（推奨）",
                },
                { val: "exercise_only", label: "🏃 運動中心", desc: "運動量でカバーする" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  className={`tag-button text-left flex flex-col rounded-xl px-5 py-4 ${
                    form.approachType === opt.val ? "selected" : ""
                  }`}
                  onClick={() =>
                    setForm({ ...form, approachType: opt.val as FormData["approachType"] })
                  }
                >
                  <span className="font-semibold">{opt.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {step === 8 && (
          <StepCard title="確認してください">
            <div className="mt-4 space-y-2 text-sm">
              <ConfirmRow label="性別" value={form.gender === "female" ? "女性" : "男性"} />
              <ConfirmRow
                label="目標"
                value={
                  form.goalType === "diet"
                    ? "ダイエット"
                    : form.goalType === "health"
                    ? "健康管理"
                    : "筋トレ・ボディメイク"
                }
              />
              <ConfirmRow label="生年月日" value={form.birthDate} />
              <ConfirmRow label="身長" value={`${form.heightCm} cm`} />
              <ConfirmRow label="体重" value={`${form.weightKg} kg`} />
              <ConfirmRow label="目標体重" value={`${form.targetWeightKg} kg`} />
              <ConfirmRow
                label="ペース"
                value={form.paceType === "soft" ? "ソフト（月0.5kg）" : "ハード（月1.0kg）"}
              />
              <ConfirmRow
                label="アプローチ"
                value={
                  form.approachType === "diet_only"
                    ? "食事中心"
                    : form.approachType === "diet_exercise"
                    ? "食事と運動"
                    : "運動中心"
                }
              />
            </div>
          </StepCard>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            className="flex-1 py-3 border-2 border-pink-200 rounded-full text-pink-400 font-semibold"
            onClick={() => setStep(step - 1)}
          >
            戻る
          </button>
        )}
        <button
          className="btn-primary flex-1"
          onClick={handleNext}
          disabled={!canNext() || loading}
        >
          {loading ? "計算中..." : step === TOTAL_STEPS ? "目標を設定する 🎯" : "次へ"}
        </button>
      </div>
    </div>
  );
}

function StepCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">{title}</h2>
      {children}
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-pink-50">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-700">{value}</span>
    </div>
  );
}
