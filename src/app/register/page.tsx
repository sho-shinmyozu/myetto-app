"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "", nickname: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let data: { success?: boolean; error?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        data = { error: "サーバーエラーが発生しました" };
      }

      if (!res.ok) {
        setError(data?.error ?? "登録に失敗しました");
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        username: form.username,
        password: form.password,
        redirect: false,
      });

      router.push("/onboarding");
    } catch {
      setError("通信エラーが発生しました。接続を確認してください");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/png/mymelody1.PNG"
            alt="myetto"
            width={100}
            height={100}
            className="rounded-full mb-3"
            style={{ objectFit: "cover" }}
          />
          <h1 className="text-2xl font-bold text-pink-500">myetto</h1>
          <p className="text-sm text-gray-500 mt-1">健康管理をもっと楽しく</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-center mb-6 text-gray-700">新規登録</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-0">

            {/* Section 1: Nickname */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                プロフィール
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  ニックネーム
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  placeholder="あすけんちゃん"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-pink-100" />
              <span className="text-xs text-gray-400">ログイン情報</span>
              <div className="flex-1 h-px bg-pink-100" />
            </div>

            {/* Section 2: Login credentials */}
            <div className="flex flex-col gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  ユーザー名（半角英数字・3〜20文字）
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="my_username"
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  パスワード（6文字以上）
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center mb-3">{error}</p>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "登録中..." : "アカウントを作成"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-pink-500 font-medium">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
