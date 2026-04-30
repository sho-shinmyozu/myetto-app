import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, goal, lastBodyRecord] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        goalType: true,
        targetWeightKg: true,
        paceType: true,
        approachType: true,
        weightKg: true,
      },
    }),
    prisma.userGoal.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: {
        dailyCalorieTarget: true,
        breakfastCalories: true,
        lunchCalories: true,
        dinnerCalories: true,
        snackCalories: true,
        targetDate: true,
      },
    }),
    prisma.bodyRecord.findFirst({
      where: { userId: session.user.id },
      orderBy: { recordDate: "desc" },
      select: { weightKg: true, recordDate: true },
    }),
  ]);

  return NextResponse.json({ user, goal, lastBodyRecord });
}
