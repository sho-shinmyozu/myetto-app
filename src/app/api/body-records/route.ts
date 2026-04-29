import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSoloUserId } from "@/lib/solo-user";
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
  const userId = await getSoloUserId();

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
      userId,
      recordDate: { gte: from },
    },
    orderBy: { recordDate: "asc" },
  });

  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const userId = await getSoloUserId();

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { recordDate, ...rest } = parsed.data;
  const date = startOfDay(new Date(recordDate));

  const record = await prisma.bodyRecord.upsert({
    where: { userId_recordDate: { userId, recordDate: date } },
    create: { userId, recordDate: date, ...rest },
    update: { ...rest },
  });

  if (rest.weightKg) {
    await prisma.user.update({
      where: { id: userId },
      data: { weightKg: rest.weightKg },
    });
  }

  return NextResponse.json({ record });
}
