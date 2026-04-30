"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setData(d.user));
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  const genderLabel = data?.gender === "female" ? "女性" : data?.gender === "male" ? "男性" : "---";

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

        {/* Personal Info */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">基本情報</h2>
          <InfoRow label="性別" value={genderLabel} />
          <InfoRow label="生年月日" value={birthDateLabel} />
          <InfoRow
            label="身長"
            value={data?.heightCm != null ? `${data.heightCm} cm` : "---"}
          />
          <InfoRow
            label="体重"
            value={data?.weightKg != null ? `${data.weightKg} kg` : "---"}
          />
        </div>

        {/* Goal Weight */}
        {data?.targetWeightKg != null && (
          <div className="card flex items-center justify-between">
            <span className="text-sm text-gray-500">目標体重</span>
            <span className="text-lg font-bold text-pink-500">
              {data.targetWeightKg} kg
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
