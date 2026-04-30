import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      nickname: true,
      gender: true,
      birthDate: true,
      heightCm: true,
      weightKg: true,
      targetWeightKg: true,
    },
  });

  return NextResponse.json({ user });
}

const patchSchema = z.object({
  gender: z.enum(["male", "female"]).optional(),
  birthDate: z.string().optional(),
  heightCm: z.number().positive().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエスト形式が正しくありません" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "入力内容を確認してください";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { gender, birthDate, heightCm } = parsed.data;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(gender !== undefined && { gender }),
      ...(birthDate !== undefined && { birthDate: new Date(birthDate) }),
      ...(heightCm !== undefined && { heightCm }),
    },
    select: {
      nickname: true,
      gender: true,
      birthDate: true,
      heightCm: true,
      weightKg: true,
      targetWeightKg: true,
    },
  });

  return NextResponse.json({ user: updated });
}
