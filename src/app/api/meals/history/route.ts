import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  // 直近10日分のMealLogを取得
  const recentLogs = await prisma.mealLog.findMany({
    where: { userId },
    orderBy: { logDate: "desc" },
    take: 10,
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

  // foodIdで重複除去（最新の使用を優先）
  const seen = new Set<string>();
  const history: {
    foodId: string;
    foodType: string;
    foodName: string;
    quantityG: number;
    calories: number;
    proteinG: number | null;
    fatG: number | null;
    carbG: number | null;
  }[] = [];

  for (const log of recentLogs) {
    for (const item of log.items) {
      if (!seen.has(item.foodId)) {
        seen.add(item.foodId);
        history.push(item);
        if (history.length >= 12) break;
      }
    }
    if (history.length >= 12) break;
  }

  return NextResponse.json({ items: history });
}
