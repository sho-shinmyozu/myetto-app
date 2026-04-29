import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSoloUserId } from "@/lib/solo-user";
import { startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const userId = await getSoloUserId();

  const dateStr = req.nextUrl.searchParams.get("date");
  const date = dateStr ? startOfDay(new Date(dateStr)) : startOfDay(new Date());
  const dayEnd = new Date(date);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [user, goal, mealLogs, lastBody] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        nickname: true,
        weightKg: true,
        targetWeightKg: true,
        goalType: true,
      },
    }),
    prisma.userGoal.findFirst({
      where: { userId, isActive: true },
    }),
    prisma.mealLog.findMany({
      where: {
        userId,
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
      where: { userId },
      orderBy: { recordDate: "desc" },
      select: { weightKg: true, recordDate: true },
    }),
  ]);

  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarb = 0;
  const mealByType: Record<string, number> = {};

  for (const log of mealLogs) {
    totalCalories += log.totalCalories;
    totalProtein += log.totalProtein;
    totalFat += log.totalFat;
    totalCarb += log.totalCarb;
    mealByType[log.mealType] = log.totalCalories;
  }

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
