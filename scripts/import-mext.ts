/**
 * 文部科学省 日本食品標準成分表 CSV インポートスクリプト
 *
 * 使い方:
 *   1. https://www.mext.go.jp/a_menu/syokuhinseibun/mext_01110.html から
 *      CSV (food_data.csv) をダウンロードして data/ フォルダに置く
 *   2. npx tsx scripts/import-mext.ts data/food_data.csv
 *
 * CSV フォーマット（文部科学省 2020年版）:
 *   食品番号, 食品名, エネルギー(kcal), たんぱく質(g), 脂質(g), 炭水化物(g), 食物繊維(g), ナトリウム(mg), ...
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { createReadStream } from "fs";
import { createInterface } from "readline";

const DB_PATH = path.resolve(process.cwd(), "dev.db");

// MEXT 標準成分表のカテゴリーマッピング（食品番号の先頭2桁）
const CATEGORY_MAP: Record<string, string> = {
  "01": "穀類",
  "02": "いも・でん粉類",
  "03": "砂糖・甘味類",
  "04": "豆類",
  "05": "種実類",
  "06": "野菜類",
  "07": "果実類",
  "08": "きのこ類",
  "09": "藻類",
  "10": "魚介類",
  "11": "肉類",
  "12": "卵類",
  "13": "乳類",
  "14": "油脂類",
  "15": "菓子類",
  "16": "嗜好飲料類",
  "17": "調味料・香辛料類",
  "18": "調理済み流通食品類",
};

// よく使う食品のエイリアス定義
const ALIASES: Array<{ pattern: RegExp; aliases: string[] }> = [
  { pattern: /精白米.*飯/, aliases: ["白米", "ご飯", "白飯", "ごはん"] },
  { pattern: /精白米.*生/, aliases: ["白米", "米"] },
  { pattern: /玄米.*飯/, aliases: ["玄米ごはん", "玄米"] },
  { pattern: /プレーンヨーグルト/, aliases: ["ヨーグルト", "プレーンヨーグルト"] },
  { pattern: /鶏.*むね.*皮なし/, aliases: ["鶏むね肉", "チキンブレスト"] },
  { pattern: /鶏.*もも.*皮なし/, aliases: ["鶏もも肉", "チキンモモ"] },
  { pattern: /さけ.*生/, aliases: ["鮭", "サーモン"] },
  { pattern: /まぐろ.*赤身/, aliases: ["マグロ", "まぐろ", "ツナ"] },
  { pattern: /鶏卵.*全卵.*生/, aliases: ["卵", "たまご", "生卵"] },
  { pattern: /牛乳.*普通/, aliases: ["牛乳", "ミルク"] },
  { pattern: /バナナ/, aliases: ["バナナ"] },
  { pattern: /りんご.*皮なし/, aliases: ["りんご", "リンゴ", "アップル"] },
  { pattern: /ブロッコリー.*生/, aliases: ["ブロッコリー"] },
  { pattern: /トマト.*生/, aliases: ["トマト"] },
  { pattern: /食パン/, aliases: ["食パン", "トースト", "パン"] },
  { pattern: /うどん.*ゆで/, aliases: ["うどん"] },
  { pattern: /そば.*ゆで/, aliases: ["そば"] },
  { pattern: /スパゲッティ.*ゆで/, aliases: ["パスタ", "スパゲッティ"] },
  { pattern: /豆腐.*木綿/, aliases: ["豆腐", "木綿豆腐"] },
  { pattern: /豆腐.*絹/, aliases: ["絹豆腐", "絹ごし豆腐"] },
];

async function importMext(csvPath: string) {
  if (!fs.existsSync(csvPath)) {
    console.error(`ファイルが見つかりません: ${csvPath}`);
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const insertFood = db.prepare(`
    INSERT OR REPLACE INTO GenericFood (
      id, food_code, name_ja, category, calories_kcal,
      protein_g, fat_g, carb_g, fiber_g, sodium_mg, source, created_at
    ) VALUES (
      lower(hex(randomblob(16))), ?, ?, ?, ?,
      ?, ?, ?, ?, ?, 'mext', datetime('now')
    )
  `);

  const insertAlias = db.prepare(`
    INSERT OR IGNORE INTO FoodAlias (id, alias, generic_food_id)
    VALUES (lower(hex(randomblob(16))), ?, (SELECT id FROM GenericFood WHERE food_code = ?))
  `);

  const insertFts = db.prepare(`
    INSERT OR REPLACE INTO foods_fts (food_id, food_type, name_ja, name_en, category)
    VALUES ((SELECT id FROM GenericFood WHERE food_code = ?), 'generic', ?, NULL, ?)
  `);

  const insertServing = db.prepare(`
    INSERT OR IGNORE INTO FoodServing (id, generic_food_id, serving_name, serving_g, sort_order)
    VALUES (
      lower(hex(randomblob(16))),
      (SELECT id FROM GenericFood WHERE food_code = ?),
      ?, ?, ?
    )
  `);

  const rl = createInterface({
    input: createReadStream(csvPath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let lineNum = 0;
  let imported = 0;
  let skipped = 0;

  const importTx = db.transaction(
    (rows: Array<{ code: string; name: string; cat: string; kcal: number; p: number | null; f: number | null; c: number | null; fiber: number | null; sodium: number | null }>) => {
      for (const row of rows) {
        insertFood.run(row.code, row.name, row.cat, row.kcal, row.p, row.f, row.c, row.fiber, row.sodium);
        insertFts.run(row.code, row.name, row.cat);

        // デフォルトサービング（100g）
        insertServing.run(row.code, "100g", 100, 0);

        // 食品別サービング
        if (row.name.includes("ご飯") || row.name.includes("飯")) {
          insertServing.run(row.code, "小盛り", 120, 1);
          insertServing.run(row.code, "普通", 150, 2);
          insertServing.run(row.code, "大盛り", 220, 3);
        }

        // エイリアス
        for (const alias of ALIASES) {
          if (alias.pattern.test(row.name)) {
            for (const a of alias.aliases) {
              insertAlias.run(a, row.code);
            }
          }
        }

        imported++;
      }
    }
  );

  const buffer: Parameters<typeof importTx>[0] = [];

  for await (const line of rl) {
    lineNum++;
    if (lineNum <= 2) continue; // ヘッダー行スキップ

    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 8) { skipped++; continue; }

    const [code, name, , , kcalStr, , proteinStr, fatStr, carbStr, fiberStr, sodiumStr] = cols;

    const kcal = parseFloat(kcalStr);
    if (!code || !name || isNaN(kcal)) { skipped++; continue; }

    const catKey = code.substring(0, 2);
    const cat = CATEGORY_MAP[catKey] ?? "その他";

    buffer.push({
      code,
      name,
      cat,
      kcal,
      p: parseFloat(proteinStr) || null,
      f: parseFloat(fatStr) || null,
      c: parseFloat(carbStr) || null,
      fiber: parseFloat(fiberStr) || null,
      sodium: parseFloat(sodiumStr) || null,
    });

    if (buffer.length >= 100) {
      importTx(buffer.splice(0, 100));
    }
  }

  if (buffer.length > 0) importTx(buffer);

  db.close();
  console.log(`✅ インポート完了: ${imported} 件, スキップ: ${skipped} 件`);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("使い方: npx tsx scripts/import-mext.ts <csvファイルのパス>");
  process.exit(1);
}

importMext(csvPath).catch(console.error);
