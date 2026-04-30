"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import SideMenu from "@/components/SideMenu";

type ProfileData = {
  nickname: string | null;
  gender: string | null;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
};

type EditForm = {
  gender: "male" | "female" | "";
  birthDate: string;
  heightCm: string;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-pink-50 last:border-none">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-700">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditForm>({ gender: "", birthDate: "", heightCm: "" });

  const fetchProfile = useCallback(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const u: ProfileData = d.user;
        setData(u);
        setForm({
          gender: (u?.gender as EditForm["gender"]) ?? "",
          birthDate: u?.birthDate ? u.birthDate.split("T")[0] : "",
          heightCm: u?.heightCm?.toString() ?? "",
        });
      });
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleLogout() {
    setLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    setSaveOk(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(form.gender && { gender: form.gender }),
          ...(form.birthDate && { birthDate: form.birthDate }),
          ...(form.heightCm && { heightCm: parseFloat(form.heightCm) }),
        }),
      });

      let json: { user?: ProfileData; error?: string } | null = null;
      try { json = await res.json(); } catch { /* ignore */ }

      if (!res.ok) {
        setSaveError(json?.error ?? "保存に失敗しました");
      } else if (json?.user) {
        setData(json.user);
        setSaveOk(true);
        setIsEditing(false);
        setTimeout(() => setSaveOk(false), 2000);
      }
    } catch {
      setSaveError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  function handleEditStart() {
    setForm({
      gender: (data?.gender as EditForm["gender"]) ?? "",
      birthDate: data?.birthDate ? data.birthDate.split("T")[0] : "",
      heightCm: data?.heightCm?.toString() ?? "",
    });
    setSaveError("");
    setSaveOk(false);
    setIsEditing(true);
  }

  const genderLabel =
    data?.gender === "female" ? "👩 女性" : data?.gender === "male" ? "👨 男性" : "---";

  const birthDateLabel = data?.birthDate
    ? format(new Date(data.birthDate), "yyyy年M月d日", { locale: ja })
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
        <h1 className="text-base font-semibold text-gray-700">ユーザー管理</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-8">
        {/* Nickname + Logout */}
        <div className="card flex items-center gap-4">
          <Image
            src="/png/mymelody1.PNG"
            alt="avatar"
            width={56}
            height={56}
            className="rounded-full flex-shrink-0"
            style={{ objectFit: "cover" }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">ニックネーム</p>
            <p className="text-lg font-bold text-gray-700 truncate">
              {data?.nickname ?? "---"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex-shrink-0 text-sm font-medium text-pink-500 border border-pink-200 rounded-full px-4 py-1.5 hover:bg-pink-50 transition-colors disabled:opacity-50"
          >
            {loggingOut ? "..." : "ログアウト"}
          </button>
        </div>

        {/* Read-only: weight */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">現在の体重</h2>
          <InfoRow
            label="体重"
            value={data?.weightKg != null ? `${data.weightKg} kg` : "---"}
          />
          {data?.targetWeightKg != null && (
            <InfoRow label="目標体重" value={`${data.targetWeightKg} kg`} />
          )}
        </div>

        {/* Basic Info */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500">基本情報</h2>
            {!isEditing && (
              <button
                onClick={handleEditStart}
                className="text-xs text-pink-500 border border-pink-200 rounded-full px-3 py-1 hover:bg-pink-50 transition-colors"
              >
                編集
              </button>
            )}
          </div>

          {!isEditing ? (
            /* 表示モード */
            <>
              <InfoRow label="性別" value={genderLabel} />
              <InfoRow label="生年月日" value={birthDateLabel} />
              <InfoRow
                label="身長"
                value={data?.heightCm != null ? `${data.heightCm} cm` : "---"}
              />
            </>
          ) : (
            /* 編集モード */
            <>
              {/* Gender */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 mb-2">性別</p>
                <div className="flex gap-3">
                  {(["female", "male"] as const).map((g) => (
                    <button
                      key={g}
                      className={`tag-button flex-1 py-2.5 text-sm ${form.gender === g ? "selected" : ""}`}
                      onClick={() => setForm({ ...form, gender: g })}
                    >
                      {g === "female" ? "👩 女性" : "👨 男性"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Birth Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  生年月日
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={form.birthDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </div>

              {/* Height */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  身長 (cm)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="input-field flex-1"
                    value={form.heightCm}
                    onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                    placeholder="160"
                    min="100"
                    max="250"
                    step="0.1"
                  />
                  <span className="text-sm text-gray-500 flex-shrink-0">cm</span>
                </div>
              </div>

              {saveError && (
                <p className="text-red-500 text-sm mb-3">{saveError}</p>
              )}
              {saveOk && (
                <p className="text-green-500 text-sm mb-3">✓ 保存しました</p>
              )}

              <div className="flex gap-2">
                <button
                  className="flex-1 py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  onClick={() => { setIsEditing(false); setSaveError(""); }}
                  disabled={saving}
                >
                  キャンセル
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "保存中..." : "保存する"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
