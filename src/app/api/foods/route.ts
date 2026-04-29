import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type FtsRow = { id: string; type: string; nameJa: string; nameEn: string | null; category: string | null };
type AliasRow = { genericFoodId: string | null; brandedFoodId: string | null };
type GenericDetail = { caloriesKcal: number; proteinG: number | null; fatG: number | null; carbG: number | null; source: string };
type BrandedDetail = { caloriesKcal: number; proteinG: number | null; fatG: number | null; carbG: number | null; servingSizeG: number | null; brand: string | null; restaurantChain: string | null };
type ServingRow = { servingName: string; servingG: number };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) return NextResponse.json({ foods: [] });

  const limit = 20;

  // FTS5 全文検索（優先）
  let results = await prisma.$queryRawUnsafe<FtsRow[]>(
    `SELECT food_id as id, food_type as type, name_ja as nameJa, name_en as nameEn, category
     FROM foods_fts WHERE foods_fts MATCH ? LIMIT ?`,
    `${q}*`,
    limit,
  );

  // FTS5 ヒットなし → alias 経由 LIKE 検索
  if (results.length === 0) {
    const aliasRows = await prisma.$queryRawUnsafe<AliasRow[]>(
      `SELECT genericFoodId, brandedFoodId FROM FoodAlias WHERE alias LIKE ? LIMIT ?`,
      `%${q}%`,
      limit,
    );

    const genericIds: string[] = [];
    const brandedIds: string[] = [];
    for (const r of aliasRows) {
      if (r.genericFoodId) genericIds.push(r.genericFoodId);
      if (r.brandedFoodId) brandedIds.push(r.brandedFoodId);
    }

    if (genericIds.length > 0) {
      const ph = genericIds.map(() => "?").join(",");
      const rows = await prisma.$queryRawUnsafe<FtsRow[]>(
        `SELECT id, 'generic' as type, nameJa, nameEn, category FROM GenericFood WHERE id IN (${ph})`,
        ...genericIds,
      );
      results.push(...rows);
    }
    if (brandedIds.length > 0) {
      const ph = brandedIds.map(() => "?").join(",");
      const rows = await prisma.$queryRawUnsafe<FtsRow[]>(
        `SELECT id, 'branded' as type, name as nameJa, NULL as nameEn, restaurantChain as category FROM BrandedFood WHERE id IN (${ph})`,
        ...brandedIds,
      );
      results.push(...rows);
    }
  }

  // 最終フォールバック: LIKE 検索
  if (results.length === 0) {
    const [genericRows, brandedRows] = await Promise.all([
      prisma.$queryRawUnsafe<FtsRow[]>(
        `SELECT id, 'generic' as type, nameJa, nameEn, category FROM GenericFood WHERE nameJa LIKE ? LIMIT ?`,
        `%${q}%`,
        limit,
      ),
      prisma.$queryRawUnsafe<FtsRow[]>(
        `SELECT id, 'branded' as type, name as nameJa, NULL as nameEn, restaurantChain as category FROM BrandedFood WHERE name LIKE ? LIMIT ?`,
        `%${q}%`,
        limit,
      ),
    ]);
    results = [...genericRows, ...brandedRows].slice(0, limit);
  }

  // カロリー情報を付加
  const foods = await Promise.all(
    results.map(async (r: FtsRow) => {
      if (r.type === "generic") {
        const [details, servings] = await Promise.all([
          prisma.$queryRawUnsafe<GenericDetail[]>(
            `SELECT caloriesKcal, proteinG, fatG, carbG, source FROM GenericFood WHERE id = ?`,
            r.id,
          ),
          prisma.$queryRawUnsafe<ServingRow[]>(
            `SELECT servingName, servingG FROM FoodServing WHERE genericFoodId = ? ORDER BY sortOrder`,
            r.id,
          ),
        ]);
        const detail = details[0];
        return {
          id: r.id,
          type: "generic",
          name: r.nameJa,
          category: r.category,
          caloriesKcal: detail?.caloriesKcal ?? 0,
          proteinG: detail?.proteinG ?? null,
          fatG: detail?.fatG ?? null,
          carbG: detail?.carbG ?? null,
          source: detail?.source ?? "mext",
          servings: servings.map((s: ServingRow) => ({ serving_name: s.servingName, serving_g: s.servingG })),
        };
      } else {
        const details = await prisma.$queryRawUnsafe<BrandedDetail[]>(
          `SELECT caloriesKcal, proteinG, fatG, carbG, servingSizeG, brand, restaurantChain FROM BrandedFood WHERE id = ?`,
          r.id,
        );
        const detail = details[0];
        return {
          id: r.id,
          type: "branded",
          name: r.nameJa,
          category: r.category ?? detail?.restaurantChain ?? detail?.brand,
          caloriesKcal: detail?.caloriesKcal ?? 0,
          proteinG: detail?.proteinG ?? null,
          fatG: detail?.fatG ?? null,
          carbG: detail?.carbG ?? null,
          source: "branded",
          servings: detail?.servingSizeG ? [{ serving_name: "1食分", serving_g: detail.servingSizeG }] : [],
        };
      }
    }),
  );

  return NextResponse.json({ foods });
}
