import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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
