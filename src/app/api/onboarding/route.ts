import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calcGoals } from "@/lib/calc/bmr";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      gender: true,
      goalType: true,
      birthDate: true,
      heightCm: true,
      weightKg: true,
      targetWeightKg: true,
      paceType: true,
      approachType: true,
      onboardingDone: true,
    },
  });

  return NextResponse.json({ user });
}

const onboardingSchema = z.object({
  gender: z.enum(["male", "female"]),
  goalType: z.enum(["diet", "health", "muscle"]),
  birthDate: z.string(),
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  targetWeightKg: z.number().positive(),
  paceType: z.enum(["hard", "soft"]),
  approachType: z.enum(["diet_only", "diet_exercise", "exercise_only"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const data = parsed.data;
  const birthDate = new Date(data.birthDate);

  const goals = calcGoals({
    gender: data.gender,
    weightKg: data.weightKg,
    targetWeightKg: data.targetWeightKg,
    heightCm: data.heightCm,
    birthDate,
    paceType: data.paceType,
    approachType: data.approachType,
  });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        gender: data.gender,
        goalType: data.goalType,
        birthDate,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        targetWeightKg: data.targetWeightKg,
        paceType: data.paceType,
        approachType: data.approachType,
        onboardingDone: true,
      },
    }),
    prisma.userGoal.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    }),
    prisma.userGoal.create({
      data: {
        userId,
        dailyCalorieTarget: goals.dailyCalorieTarget,
        breakfastCalories: goals.breakfastCalories,
        lunchCalories: goals.lunchCalories,
        dinnerCalories: goals.dinnerCalories,
        snackCalories: goals.snackCalories,
        dailyStepsTarget: goals.dailyStepsTarget,
        estimatedBmr: goals.bmr,
        targetDate: goals.targetDate,
      },
    }),
  ]);

  return NextResponse.json({ goals, daysToGoal: goals.daysToGoal });
}
