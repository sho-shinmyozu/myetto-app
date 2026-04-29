import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) return NextResponse.json({ foods: [] });

  const limit = 20;

  // GenericFood 名前検索
  const [generics, branded] = await Promise.all([
    prisma.genericFood.findMany({
      where: {
        OR: [
          { nameJa: { contains: q, mode: "insensitive" } },
          { nameEn: { contains: q, mode: "insensitive" } },
          { aliases: { some: { alias: { contains: q, mode: "insensitive" } } } },
        ],
      },
      take: limit,
      select: {
        id: true,
        nameJa: true,
        nameEn: true,
        category: true,
        caloriesKcal: true,
        proteinG: true,
        fatG: true,
        carbG: true,
        source: true,
        servings: {
          select: { servingName: true, servingG: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.brandedFood.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { aliases: { some: { alias: { contains: q, mode: "insensitive" } } } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        restaurantChain: true,
        brand: true,
        caloriesKcal: true,
        proteinG: true,
        fatG: true,
        carbG: true,
        servingSizeG: true,
      },
    }),
  ]);

  const foods = [
    ...generics.map((f) => ({
      id: f.id,
      type: "generic" as const,
      name: f.nameJa,
      category: f.category,
      caloriesKcal: f.caloriesKcal,
      proteinG: f.proteinG,
      fatG: f.fatG,
      carbG: f.carbG,
      source: f.source,
      servings: f.servings.map((s) => ({ serving_name: s.servingName, serving_g: s.servingG })),
    })),
    ...branded.map((f) => ({
      id: f.id,
      type: "branded" as const,
      name: f.name,
      category: f.restaurantChain ?? f.brand ?? null,
      caloriesKcal: f.caloriesKcal,
      proteinG: f.proteinG,
      fatG: f.fatG,
      carbG: f.carbG,
      source: "branded",
      servings: f.servingSizeG ? [{ serving_name: "1食分", serving_g: f.servingSizeG }] : [],
    })),
  ].slice(0, limit);

  return NextResponse.json({ foods });
}
