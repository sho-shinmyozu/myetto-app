"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BodyRecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    weightKg: "",
    chestCm: "",
    waistCm: "",
    hipCm: "",
    upperArmCm: "",
    calfCm: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const payload = {
      recordDate: date,
      weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
      chestCm: form.chestCm ? parseFloat(form.chestCm) : undefined,
      waistCm: form.waistCm ? parseFloat(form.waistCm) : undefined,
      hipCm: form.hipCm ? parseFloat(form.hipCm) : undefined,
      upperArmCm: form.upperArmCm ? parseFloat(form.upperArmCm) : undefined,
      calfCm: form.calfCm ? parseFloat(form.calfCm) : undefined,
      notes: form.notes || undefined,
    };

    const res = await fetch("/api/body-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push(`/dashboard?date=${date}`);
    }
    setSaving(false);
  }

  const fields = [
    { key: "weightKg", label: "体重", unit: "kg", placeholder: "65.0", emoji: "⚖️" },
    { key: "chestCm", label: "胸囲", unit: "cm", placeholder: "90", emoji: "👚" },
    { key: "waistCm", label: "ウエスト", unit: "cm", placeholder: "75", emoji: "📏" },
    { key: "hipCm", label: "ヒップ", unit: "cm", placeholder: "95", emoji: "🍑" },
    { key: "upperArmCm", label: "二の腕", unit: "cm", placeholder: "30", emoji: "💪" },
    { key: "calfCm", label: "ふくらはぎ", unit: "cm", placeholder: "38", emoji: "🦵" },
  ];

  return (
    <div className="flex flex-col min-h-svh">
      <header className="sticky top-0 z-10 bg-white border-b border-pink-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 p-1">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-700 text-lg">⚖️ カラダ記録</h1>
      </header>

      <div className="flex-1 px-4 py-4">
        <div className="card space-y-4">
          {fields.map((f) => (
            <div key={f.key} className="flex items-center gap-3">
              <span className="text-xl w-8">{f.emoji}</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="input-field flex-1"
                    placeholder={f.placeholder}
                    step="0.1"
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                  <span className="text-sm text-gray-400 w-8">{f.unit}</span>
                </div>
              </div>
            </div>
          ))}

          <div>
            <label className="block text-xs text-gray-400 mb-1">メモ</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="体調など..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-pink-100 px-4 py-4">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "記録する ✓"}
        </button>
      </div>
    </div>
  );
}

export default function BodyRecordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-svh">読み込み中...</div>}>
      <BodyRecordContent />
    </Suspense>
  );
}
