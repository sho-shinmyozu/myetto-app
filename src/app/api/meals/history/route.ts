import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const FETCH_LOGS = 30;
const RETURN_ITEMS = 12;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const mealType = req.nextUrl.searchParams.get("mealType") ?? undefined;

  const recentLogs = await prisma.mealLog.findMany({
    where: {
      userId,
      ...(mealType ? { mealType } : {}),
    },
    orderBy: { logDate: "desc" },
    take: FETCH_LOGS,
    select: {
      items: {
        select: {
          foodId: true,
          foodType: true,
          foodName: true,
          quantityG: true,
          calories: true,
          proteinG: true,
          fatG: true,
          carbG: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  // foodId ごとにスコアを集計
  // 出現ログのインデックスが小さいほど（最近）重みを高くする
  // score += (FETCH_LOGS - logIndex) / FETCH_LOGS
  const scoreMap = new Map<
    string,
    {
      score: number;
      item: {
        foodId: string;
        foodType: string;
        foodName: string;
        quantityG: number;
        calories: number;
        proteinG: number | null;
        fatG: number | null;
        carbG: number | null;
      };
    }
  >();

  recentLogs.forEach((log: typeof recentLogs[number], logIndex: number) => {
    const weight = (FETCH_LOGS - logIndex) / FETCH_LOGS;
    for (const item of log.items) {
      const existing = scoreMap.get(item.foodId);
      if (existing) {
        existing.score += weight;
      } else {
        scoreMap.set(item.foodId, { score: weight, item });
      }
    }
  });

  const history = [...scoreMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, RETURN_ITEMS)
    .map(({ item }) => item);

  return NextResponse.json({ items: history });
}
