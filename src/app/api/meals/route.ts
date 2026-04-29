import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { startOfDay } from "date-fns";

const itemSchema = z.object({
  foodId: z.string(),
  foodType: z.enum(["generic", "branded", "user"]),
  foodName: z.string(),
  quantityG: z.number().positive(),
  calories: z.number().nonnegative(),
  proteinG: z.number().nullable().optional(),
  fatG: z.number().nullable().optional(),
  carbG: z.number().nullable().optional(),
});

const mealSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  logDate: z.string(),
  items: z.array(itemSchema),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dateStr = req.nextUrl.searchParams.get("date");
  const date = dateStr ? new Date(dateStr) : new Date();
  const dayStart = startOfDay(date);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const logs = await prisma.mealLog.findMany({
    where: {
      userId: session.user.id,
      logDate: { gte: dayStart, lt: dayEnd },
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
    orderBy: { mealType: "asc" },
  });

  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = mealSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { mealType, logDate, items, notes } = parsed.data;
  const logDateObj = startOfDay(new Date(logDate));

  const totalCalories = items.reduce((s, i) => s + i.calories, 0);
  const totalProtein = items.reduce((s, i) => s + (i.proteinG ?? 0), 0);
  const totalFat = items.reduce((s, i) => s + (i.fatG ?? 0), 0);
  const totalCarb = items.reduce((s, i) => s + (i.carbG ?? 0), 0);

  const mealLog = await prisma.mealLog.upsert({
    where: {
      userId_mealType_logDate: {
        userId: session.user.id,
        mealType,
        logDate: logDateObj,
      },
    },
    create: {
      userId: session.user.id,
      mealType,
      logDate: logDateObj,
      totalCalories,
      totalProtein,
      totalFat,
      totalCarb,
      notes,
      items: {
        create: items.map((item, idx) => ({
          foodId: item.foodId,
          foodType: item.foodType,
          foodName: item.foodName,
          quantityG: item.quantityG,
          calories: item.calories,
          proteinG: item.proteinG ?? null,
          fatG: item.fatG ?? null,
          carbG: item.carbG ?? null,
          sortOrder: idx,
        })),
      },
    },
    update: {
      totalCalories,
      totalProtein,
      totalFat,
      totalCarb,
      notes,
      items: {
        deleteMany: {},
        create: items.map((item, idx) => ({
          foodId: item.foodId,
          foodType: item.foodType,
          foodName: item.foodName,
          quantityG: item.quantityG,
          calories: item.calories,
          proteinG: item.proteinG ?? null,
          fatG: item.fatG ?? null,
          carbG: item.carbG ?? null,
          sortOrder: idx,
        })),
      },
    },
    include: { items: true },
  });

  // daily_summary 更新
  await updateDailySummary(session.user.id, logDateObj);

  return NextResponse.json({ mealLog });
}

async function updateDailySummary(userId: string, date: Date) {
  const dayEnd = new Date(date);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const logs = await prisma.mealLog.findMany({
    where: { userId, logDate: { gte: date, lt: dayEnd } },
    select: { totalCalories: true },
  });

  const totalCalories = logs.reduce((s, l) => s + l.totalCalories, 0);

  const goal = await prisma.userGoal.findFirst({
    where: { userId, isActive: true },
    select: { dailyCalorieTarget: true },
  });

  const calorieGoal = goal?.dailyCalorieTarget ?? 2000;

  await prisma.dailySummary.upsert({
    where: { userId_summaryDate: { userId, summaryDate: date } },
    create: {
      userId,
      summaryDate: date,
      totalCalories,
      calorieGoal,
      isGoalAchieved: totalCalories <= calorieGoal,
    },
    update: {
      totalCalories,
      calorieGoal,
      isGoalAchieved: totalCalories <= calorieGoal,
    },
  });
}
