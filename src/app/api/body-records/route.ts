import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { startOfDay, subDays } from "date-fns";

const bodySchema = z.object({
  recordDate: z.string(),
  weightKg: z.number().positive().nullable().optional(),
  chestCm: z.number().positive().nullable().optional(),
  waistCm: z.number().positive().nullable().optional(),
  hipCm: z.number().positive().nullable().optional(),
  upperArmCm: z.number().positive().nullable().optional(),
  calfCm: z.number().positive().nullable().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = req.nextUrl.searchParams.get("period") ?? "1m";
  const daysMap: Record<string, number> = {
    "1w": 7,
    "1m": 30,
    "3m": 90,
    "1y": 365,
  };
  const days = daysMap[period] ?? 30;
  const from = startOfDay(subDays(new Date(), days));

  const records = await prisma.bodyRecord.findMany({
    where: {
      userId: session.user.id,
      recordDate: { gte: from },
    },
    orderBy: { recordDate: "asc" },
  });

  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { recordDate, ...rest } = parsed.data;
  const date = startOfDay(new Date(recordDate));

  const record = await prisma.bodyRecord.upsert({
    where: { userId_recordDate: { userId: session.user.id, recordDate: date } },
    create: { userId: session.user.id, recordDate: date, ...rest },
    update: { ...rest },
  });

  // 体重記録があれば user.weightKg も更新
  if (rest.weightKg) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { weightKg: rest.weightKg },
    });
  }

  return NextResponse.json({ record });
}
