"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideMenu from "@/components/SideMenu";

type UserData = {
  gender: string | null;
  goalType: string | null;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  paceType: string | null;
  approachType: string | null;
  onboardingDone: boolean;
};

type EditForm = {
  goalType: "diet" | "health" | "muscle" | "";
  targetWeightKg: string;
  paceType: "hard" | "soft" | "";
  approachType: "diet_only" | "diet_exercise" | "exercise_only" | "";
};

const GENDER_LABELS: Record<string, string> = { female: "女性", male: "男性" };

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-gray-500">{value}</span>
    </div>
  );
}

export default function GoalEditPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [form, setForm] = useState<EditForm>({
    goalType: "",
    targetWeightKg: "",
    paceType: "",
    approachType: "",
  });

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((d) => {
        const u: UserData = d.user;
        setUserData(u);
        setForm({
          goalType: (u?.goalType as EditForm["goalType"]) ?? "",
          targetWeightKg: u?.targetWeightKg?.toString() ?? "",
          paceType: (u?.paceType as EditForm["paceType"]) ?? "",
          approachType: (u?.approachType as EditForm["approachType"]) ?? "",
        });
        setLoading(false);
      });
  }, []);

  const canSave =
    form.goalType !== "" &&
    form.targetWeightKg !== "" &&
    form.paceType !== "" &&
    form.approachType !== "";

  async function handleSave() {
    if (!userData || !canSave) return;
    setSaving(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender: userData.gender,
          goalType: form.goalType,
          birthDate: userData.birthDate,
          heightCm: userData.heightCm,
          weightKg: userData.weightKg,
          targetWeightKg: parseFloat(form.targetWeightKg),
          paceType: form.paceType,
          approachType: form.approachType,
        }),
      });

      if (res.ok) {
        router.push("/goal");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    );
  }

  const birthDateDisplay = userData?.birthDate
    ? new Date(userData.birthDate).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "---";

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
        <h1 className="text-base font-semibold text-gray-700">目標を更新</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-8">
        {/* Read-only personal info */}
        <div className="card border border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            基本情報（変更不可）
          </p>
          <ReadOnlyRow
            label="性別"
            value={userData?.gender ? (GENDER_LABELS[userData.gender] ?? "---") : "---"}
          />
          <ReadOnlyRow label="生年月日" value={birthDateDisplay} />
          <ReadOnlyRow
            label="身長"
            value={userData?.heightCm != null ? `${userData.heightCm} cm` : "---"}
          />
          <ReadOnlyRow
            label="体重"
            value={userData?.weightKg != null ? `${userData.weightKg} kg` : "---"}
          />
        </div>

        {/* goalType */}
        <div className="card">
          <p className="text-sm font-semibold text-gray-600 mb-3">目的</p>
          <div className="flex flex-col gap-2">
            {[
              { val: "diet", label: "🍎 ダイエット", desc: "体重を減らしたい" },
              { val: "health", label: "💪 健康管理", desc: "健康的な体を維持したい" },
              { val: "muscle", label: "🏋️ 筋トレ・ボディメイク", desc: "筋肉をつけたい" },
            ].map((opt) => (
              <button
                key={opt.val}
                className={`tag-button text-left flex flex-col rounded-xl px-4 py-3 ${
                  form.goalType === opt.val ? "selected" : ""
                }`}
                onClick={() => setForm({ ...form, goalType: opt.val as EditForm["goalType"] })}
              >
                <span className="font-semibold text-sm">{opt.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* targetWeightKg */}
        <div className="card">
          <p className="text-sm font-semibold text-gray-600 mb-3">目標体重</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="input-field flex-1"
              value={form.targetWeightKg}
              onChange={(e) => setForm({ ...form, targetWeightKg: e.target.value })}
              placeholder="55"
              min="30"
              max="300"
              step="0.1"
            />
            <span className="text-sm text-gray-500 flex-shrink-0">kg</span>
          </div>
          {userData?.weightKg && form.targetWeightKg && (
            <p className="text-xs text-pink-400 mt-2">
              現在との差：{(userData.weightKg - parseFloat(form.targetWeightKg)).toFixed(1)} kg
            </p>
          )}
        </div>

        {/* paceType */}
        <div className="card">
          <p className="text-sm font-semibold text-gray-600 mb-3">ペース</p>
          <div className="flex flex-col gap-2">
            {[
              { val: "soft", label: "🐢 ソフト", desc: "月 0.5kg ペース（無理なく続ける）", badge: "おすすめ" },
              { val: "hard", label: "🔥 ハード", desc: "月 1.0kg ペース（しっかり絞る）", badge: null },
            ].map((opt) => (
              <button
                key={opt.val}
                className={`tag-button text-left flex flex-col rounded-xl px-4 py-3 relative ${
                  form.paceType === opt.val ? "selected" : ""
                }`}
                onClick={() => setForm({ ...form, paceType: opt.val as EditForm["paceType"] })}
              >
                {opt.badge && (
                  <span className="absolute top-2 right-3 text-xs bg-pink-100 text-pink-500 px-2 py-0.5 rounded-full">
                    {opt.badge}
                  </span>
                )}
                <span className="font-semibold text-sm">{opt.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* approachType */}
        <div className="card">
          <p className="text-sm font-semibold text-gray-600 mb-3">減量アプローチ</p>
          <div className="flex flex-col gap-2">
            {[
              { val: "diet_only", label: "🥗 食事中心", desc: "食事管理でコントロール" },
              { val: "diet_exercise", label: "🥗+🏃 食事と運動", desc: "バランスよく取り組む（推奨）" },
              { val: "exercise_only", label: "🏃 運動中心", desc: "運動量でカバーする" },
            ].map((opt) => (
              <button
                key={opt.val}
                className={`tag-button text-left flex flex-col rounded-xl px-4 py-3 ${
                  form.approachType === opt.val ? "selected" : ""
                }`}
                onClick={() => setForm({ ...form, approachType: opt.val as EditForm["approachType"] })}
              >
                <span className="font-semibold text-sm">{opt.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          className="btn-primary w-full"
          onClick={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? "更新中..." : "目標を更新する 🎯"}
        </button>
      </main>
    </div>
  );
}
