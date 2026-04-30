import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
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

type Item = z.infer<typeof itemSchema>;

function sumItems(items: Item[]) {
  let calories = 0;
  let protein = 0;
  let fat = 0;
  let carb = 0;
  for (const item of items) {
    calories += item.calories;
    protein += item.proteinG ?? 0;
    fat += item.fatG ?? 0;
    carb += item.carbG ?? 0;
  }
  return { calories, protein, fat, carb };
}

function toItemCreate(item: Item, idx: number) {
  return {
    foodId: item.foodId,
    foodType: item.foodType,
    foodName: item.foodName,
    quantityG: item.quantityG,
    calories: item.calories,
    proteinG: item.proteinG ?? null,
    fatG: item.fatG ?? null,
    carbG: item.carbG ?? null,
    sortOrder: idx,
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const dateStr = req.nextUrl.searchParams.get("date");
  const date = dateStr ? new Date(dateStr) : new Date();
  const dayStart = startOfDay(date);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const logs = await prisma.mealLog.findMany({
    where: {
      userId,
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
  const userId = session.user.id;

  const body = await req.json();
  const parsed = mealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { mealType, logDate, items, notes } = parsed.data;
  const logDateObj = startOfDay(new Date(logDate));

  // アイテムが空の場合はMealLogを削除してDBにゼロデータを残さない
  if (items.length === 0) {
    await prisma.mealLog.deleteMany({
      where: { userId, mealType, logDate: logDateObj },
    });
    updateDailySummary(userId, logDateObj).catch((err) =>
      console.error("[updateDailySummary] error:", err)
    );
    return NextResponse.json({ mealLog: null });
  }

  const { calories, protein, fat, carb } = sumItems(items);
  const itemCreate = items.map(toItemCreate);

  const mealLog = await prisma.mealLog.upsert({
    where: {
      userId_mealType_logDate: {
        userId,
        mealType,
        logDate: logDateObj,
      },
    },
    create: {
      userId,
      mealType,
      logDate: logDateObj,
      totalCalories: calories,
      totalProtein: protein,
      totalFat: fat,
      totalCarb: carb,
      notes,
      items: { create: itemCreate },
    },
    update: {
      totalCalories: calories,
      totalProtein: protein,
      totalFat: fat,
      totalCarb: carb,
      notes,
      items: { deleteMany: {}, create: itemCreate },
    },
    include: { items: true },
  });

  updateDailySummary(userId, logDateObj).catch((err) =>
    console.error("[updateDailySummary] error:", err)
  );

  return NextResponse.json({ mealLog });
}

async function updateDailySummary(userId: string, date: Date) {
  const dayEnd = new Date(date);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [logs, goal] = await Promise.all([
    prisma.mealLog.findMany({
      where: { userId, logDate: { gte: date, lt: dayEnd } },
      select: { totalCalories: true },
    }),
    prisma.userGoal.findFirst({
      where: { userId, isActive: true },
      select: { dailyCalorieTarget: true },
    }),
  ]);

  let totalCalories = 0;
  for (const log of logs) {
    totalCalories += log.totalCalories ?? 0;
  }

  // 全食事が削除されてカロリーが0になった場合はDailySummaryも削除する
  if (totalCalories === 0) {
    await prisma.dailySummary.deleteMany({
      where: { userId, summaryDate: date },
    });
    return;
  }

  const calorieGoal = goal?.dailyCalorieTarget ?? 2000;
  const isGoalAchieved = totalCalories <= calorieGoal;

  await prisma.dailySummary.upsert({
    where: { userId_summaryDate: { userId, summaryDate: date } },
    create: { userId, summaryDate: date, totalCalories, calorieGoal, isGoalAchieved },
    update: { totalCalories, calorieGoal, isGoalAchieved },
  });
}
