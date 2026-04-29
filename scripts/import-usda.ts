/**
 * USDA FoodData Central インポートスクリプト
 *
 * 使い方:
 *   1. https://fdc.nal.usda.gov/download-datasets.html から
 *      "Foundation Foods" の CSV をダウンロードして data/ に展開
 *   2. npx tsx scripts/import-usda.ts data/FoodData_Central_foundation_food_csv_YYYY-MM-DD
 *
 * または検索 API 経由で個別取得:
 *   USDA_API_KEY=<key> npx tsx scripts/import-usda.ts --api "chicken breast"
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "dev.db");
const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";

async function importViaApi(query: string, apiKey: string) {
  const db = new Database(DB_PATH);

  const url = `${USDA_API_BASE}/foods/search?query=${encodeURIComponent(query)}&dataType=Foundation,SR Legacy&pageSize=25&api_key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json() as {
    foods: Array<{
      fdcId: number;
      description: string;
      foodCategory: string;
      foodNutrients: Array<{ nutrientId: number; value: number }>;
    }>
  };

  const insertFood = db.prepare(`
    INSERT OR IGNORE INTO GenericFood (
      id, food_code, name_ja, name_en, category, calories_kcal,
      protein_g, fat_g, carb_g, source, created_at
    ) VALUES (
      lower(hex(randomblob(16))), ?, ?, ?, ?, ?,
      ?, ?, ?, 'usda', datetime('now')
    )
  `);

  const insertFts = db.prepare(`
    INSERT OR IGNORE INTO foods_fts (food_id, food_type, name_ja, name_en, category)
    VALUES ((SELECT id FROM GenericFood WHERE food_code = ?), 'generic', ?, ?, ?)
  `);

  let count = 0;
  for (const food of data.foods ?? []) {
    const nutrients = food.foodNutrients ?? [];
    const getN = (id: number) => nutrients.find((n) => n.nutrientId === id)?.value ?? null;

    // USDA nutrient IDs: 1008=Energy, 1003=Protein, 1004=Fat, 1005=Carbs
    const kcal = getN(1008) ?? 0;
    const protein = getN(1003);
    const fat = getN(1004);
    const carb = getN(1005);

    const code = `usda-${food.fdcId}`;
    insertFood.run(code, food.description, food.description, food.foodCategory, kcal, protein, fat, carb);
    insertFts.run(code, food.description, food.description, food.foodCategory);
    count++;
  }

  db.close();
  console.log(`✅ USDA API から ${count} 件インポート`);
}

const args = process.argv.slice(2);
if (args[0] === "--api") {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    console.error("USDA_API_KEY 環境変数が必要です");
    process.exit(1);
  }
  importViaApi(args[1], apiKey).catch(console.error);
} else {
  console.log("使い方:");
  console.log("  API: USDA_API_KEY=<key> npx tsx scripts/import-usda.ts --api 'chicken breast'");
  console.log("  CSV: npx tsx scripts/import-usda.ts data/<展開フォルダ>");
}
