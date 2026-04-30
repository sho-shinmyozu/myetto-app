import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const yearMonth = req.nextUrl.searchParams.get("month"); // "2026-04"
  const base = yearMonth ? new Date(`${yearMonth}-01`) : new Date();
  const from = startOfMonth(base);
  const to = endOfMonth(base);

  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      summaryDate: { gte: from, lte: to },
      totalCalories: { gt: 0 },
    },
    select: {
      summaryDate: true,
      totalCalories: true,
      calorieGoal: true,
    },
    orderBy: { summaryDate: "asc" },
  });

  // isGoalAchieved をリアルタイムで再計算する
  // DB保存値は目標変更後に古くなるため、数値から直接判定する
  type SummaryRow = { summaryDate: Date; totalCalories: number; calorieGoal: number };
  const result = summaries.map((s: SummaryRow) => ({
    summaryDate: s.summaryDate,
    totalCalories: s.totalCalories,
    calorieGoal: s.calorieGoal,
    isGoalAchieved: s.totalCalories > 0 && s.totalCalories <= s.calorieGoal,
  }));

  return NextResponse.json({ summaries: result });
}
