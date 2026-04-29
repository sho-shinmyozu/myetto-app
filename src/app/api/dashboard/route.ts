import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dateStr = req.nextUrl.searchParams.get("date");
  const date = dateStr ? startOfDay(new Date(dateStr)) : startOfDay(new Date());
  const dayEnd = new Date(date);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [user, goal, mealLogs, lastBody] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        nickname: true,
        weightKg: true,
        targetWeightKg: true,
        goalType: true,
      },
    }),
    prisma.userGoal.findFirst({
      where: { userId: session.user.id, isActive: true },
    }),
    prisma.mealLog.findMany({
      where: {
        userId: session.user.id,
        logDate: { gte: date, lt: dayEnd },
      },
      select: {
        mealType: true,
        totalCalories: true,
        totalProtein: true,
        totalFat: true,
        totalCarb: true,
      },
    }),
    prisma.bodyRecord.findFirst({
      where: { userId: session.user.id },
      orderBy: { recordDate: "desc" },
      select: { weightKg: true, recordDate: true },
    }),
  ]);

  const totalCalories = mealLogs.reduce((s: number, l) => s + l.totalCalories, 0);
  const totalProtein = mealLogs.reduce((s: number, l) => s + l.totalProtein, 0);
  const totalFat = mealLogs.reduce((s: number, l) => s + l.totalFat, 0);
  const totalCarb = mealLogs.reduce((s: number, l) => s + l.totalCarb, 0);

  const mealByType = Object.fromEntries(
    mealLogs.map((l) => [l.mealType, l.totalCalories])
  );

  return NextResponse.json({
    user,
    goal,
    today: {
      totalCalories,
      totalProtein,
      totalFat,
      totalCarb,
      meals: mealByType,
      remainingCalories: Math.max(0, (goal?.dailyCalorieTarget ?? 2000) - totalCalories),
    },
    lastBodyRecord: lastBody,
  });
}
