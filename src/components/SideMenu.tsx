"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SideMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { href: "/dashboard", label: "ホーム", emoji: "🏠" },
    { href: "/graph", label: "体重グラフ", emoji: "📈" },
    { href: "/calendar", label: "カレンダー", emoji: "📅" },
    { href: "/onboarding", label: "目標を編集", emoji: "🎯" },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-full w-72 bg-white z-30 shadow-2xl transform transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="px-6 pt-10 pb-6 border-b border-pink-50"
           style={{ background: "linear-gradient(135deg, #fff5f9, #fce7f3)" }}>
        <Image
          src="/png/mymelody1.PNG"
          alt="myetto"
          width={56}
          height={56}
          className="rounded-full mb-3"
          style={{ objectFit: "cover" }}
        />
        <h2 className="text-xl font-bold text-pink-500">myetto</h2>
        <p className="text-xs text-gray-400 mt-0.5">健康管理アプリ</p>
      </div>

      {/* Nav */}
      <nav className="px-4 py-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "text-white"
                  : "text-gray-600 hover:bg-pink-50"
              }`}
              style={
                isActive
                  ? { background: "linear-gradient(135deg, #f9a8d4, #f05a9e)" }
                  : {}
              }
            >
              <span className="text-lg">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 space-y-2">
        <button
          onClick={() => {
            onClose();
            router.push("/body-record");
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-pink-50"
        >
          <span className="text-lg">📋</span>
          <span>カラダ記録</span>
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50"
        >
          <span className="text-lg">🚪</span>
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
}
