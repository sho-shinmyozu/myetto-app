import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "半角英数字とアンダースコアのみ使用できます"),
  password: z.string().min(6, "パスワードは6文字以上で入力してください"),
  nickname: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "リクエスト形式が正しくありません" }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "入力内容を確認してください";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { username, password, nickname } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return NextResponse.json({ error: "このユーザー名はすでに使われています" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        username,
        passwordHash,
        nickname: nickname ?? username,
        onboardingDone: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register] unexpected error:", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました。しばらくしてから再試行してください" }, { status: 500 });
  }
}
