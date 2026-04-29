import { NextRequest, NextResponse } from "next/server";
import { getSqliteDb } from "@/lib/db";

type FtsRow = { id: string; type: string; nameJa: string; nameEn: string | null; category: string | null };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) return NextResponse.json({ foods: [] });

  const db = getSqliteDb();
  const limit = 20;

  // FTS5 全文検索（優先）
  let results = db
    .prepare(
      `SELECT food_id as id, food_type as type, name_ja as nameJa, name_en as nameEn, category
       FROM foods_fts WHERE foods_fts MATCH ? LIMIT ?`
    )
    .all(`${q}*`, limit) as FtsRow[];

  // FTS5 ヒットなし → alias 経由 LIKE 検索
  if (results.length === 0) {
    const aliasRows = db
      .prepare(
        `SELECT genericFoodId, brandedFoodId FROM FoodAlias WHERE alias LIKE ? LIMIT ?`
      )
      .all(`%${q}%`, limit) as Array<{ genericFoodId: string | null; brandedFoodId: string | null }>;

    const genericIds = aliasRows.filter((r) => r.genericFoodId).map((r) => r.genericFoodId as string);
    const brandedIds = aliasRows.filter((r) => r.brandedFoodId).map((r) => r.brandedFoodId as string);

    if (genericIds.length > 0) {
      const ph = genericIds.map(() => "?").join(",");
      results.push(
        ...(db
          .prepare(`SELECT id, 'generic' as type, nameJa, nameEn, category FROM GenericFood WHERE id IN (${ph})`)
          .all(...genericIds) as FtsRow[])
      );
    }
    if (brandedIds.length > 0) {
      const ph = brandedIds.map(() => "?").join(",");
      results.push(
        ...(db
          .prepare(`SELECT id, 'branded' as type, name as nameJa, NULL as nameEn, restaurantChain as category FROM BrandedFood WHERE id IN (${ph})`)
          .all(...brandedIds) as FtsRow[])
      );
    }
  }

  // 最終フォールバック: LIKE 検索
  if (results.length === 0) {
    const genericRows = db
      .prepare(`SELECT id, 'generic' as type, nameJa, nameEn, category FROM GenericFood WHERE nameJa LIKE ? LIMIT ?`)
      .all(`%${q}%`, limit) as FtsRow[];
    const brandedRows = db
      .prepare(`SELECT id, 'branded' as type, name as nameJa, NULL as nameEn, restaurantChain as category FROM BrandedFood WHERE name LIKE ? LIMIT ?`)
      .all(`%${q}%`, limit) as FtsRow[];
    results = [...genericRows, ...brandedRows].slice(0, limit);
  }

  // カロリー情報を付加
  const foods = results.map((r) => {
    if (r.type === "generic") {
      const detail = db
        .prepare(`SELECT caloriesKcal, proteinG, fatG, carbG, source FROM GenericFood WHERE id = ?`)
        .get(r.id) as { caloriesKcal: number; proteinG: number | null; fatG: number | null; carbG: number | null; source: string } | undefined;

      const servings = db
        .prepare(`SELECT servingName, servingG FROM FoodServing WHERE genericFoodId = ? ORDER BY sortOrder`)
        .all(r.id) as Array<{ servingName: string; servingG: number }>;

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
        servings: servings.map((s) => ({ serving_name: s.servingName, serving_g: s.servingG })),
      };
    } else {
      const detail = db
        .prepare(`SELECT caloriesKcal, proteinG, fatG, carbG, servingSizeG, brand, restaurantChain FROM BrandedFood WHERE id = ?`)
        .get(r.id) as { caloriesKcal: number; proteinG: number | null; fatG: number | null; carbG: number | null; servingSizeG: number | null; brand: string | null; restaurantChain: string | null } | undefined;

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
  });

  return NextResponse.json({ foods });
}
