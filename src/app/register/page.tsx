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

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "登録に失敗しました");
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      username: form.username,
      password: form.password,
      redirect: false,
    });

    router.push("/onboarding");
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                ニックネーム（アプリ内表示名）
              </label>
              <input
                type="text"
                className="input-field"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="あすけんちゃん"
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

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button type="submit" className="btn-primary mt-2" disabled={loading}>
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
