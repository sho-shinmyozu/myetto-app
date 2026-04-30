/**
 * 食品サンプルデータ投入スクリプト（Prisma版・PostgreSQL対応）
 * 使い方: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const FOODS = [
  // 穀類
  { code: "01-001", name: "精白米（炊飯）",              cat: "穀類",         kcal: 168, p: 2.5,  f: 0.3,  c: 37.1 },
  { code: "01-002", name: "食パン",                       cat: "穀類",         kcal: 264, p: 9.3,  f: 4.4,  c: 49.0 },
  { code: "01-003", name: "うどん（ゆで）",               cat: "穀類",         kcal: 105, p: 2.6,  f: 0.4,  c: 21.6 },
  { code: "01-004", name: "そば（ゆで）",                 cat: "穀類",         kcal: 132, p: 4.8,  f: 1.0,  c: 26.0 },
  { code: "01-005", name: "スパゲッティ（ゆで）",         cat: "穀類",         kcal: 165, p: 5.8,  f: 0.9,  c: 32.2 },
  // 肉類
  { code: "11-001", name: "鶏むね肉（皮なし・生）",       cat: "肉類",         kcal: 116, p: 23.3, f: 1.9,  c: 0   },
  { code: "11-002", name: "鶏もも肉（皮なし・生）",       cat: "肉類",         kcal: 127, p: 19.0, f: 5.0,  c: 0   },
  { code: "11-003", name: "牛もも肉（赤身・生）",         cat: "肉類",         kcal: 140, p: 21.3, f: 5.7,  c: 0.1 },
  { code: "11-004", name: "豚ロース（皮下脂肪なし・生）", cat: "肉類",         kcal: 157, p: 22.7, f: 7.8,  c: 0.1 },
  // 魚介類
  { code: "10-001", name: "さけ（生）",                   cat: "魚介類",       kcal: 133, p: 22.3, f: 4.1,  c: 0.1 },
  { code: "10-002", name: "まぐろ赤身（生）",             cat: "魚介類",       kcal: 125, p: 26.4, f: 1.4,  c: 0.1 },
  { code: "10-003", name: "さば（生）",                   cat: "魚介類",       kcal: 211, p: 20.6, f: 12.1, c: 0.3 },
  // 卵・乳類
  { code: "12-001", name: "鶏卵（全卵・生）",             cat: "卵類",         kcal: 151, p: 12.3, f: 10.3, c: 0.3 },
  { code: "13-001", name: "普通牛乳",                     cat: "乳類",         kcal: 67,  p: 3.3,  f: 3.8,  c: 4.8 },
  { code: "13-002", name: "プレーンヨーグルト（無糖）",   cat: "乳類",         kcal: 62,  p: 3.6,  f: 3.0,  c: 4.9 },
  { code: "13-003", name: "プロセスチーズ",               cat: "乳類",         kcal: 339, p: 22.7, f: 26.0, c: 1.3 },
  // 野菜類
  { code: "06-001", name: "ブロッコリー（生）",           cat: "野菜類",       kcal: 33,  p: 4.3,  f: 0.5,  c: 5.2 },
  { code: "06-002", name: "トマト（生）",                 cat: "野菜類",       kcal: 20,  p: 0.7,  f: 0.1,  c: 4.7 },
  { code: "06-003", name: "キャベツ（生）",               cat: "野菜類",       kcal: 23,  p: 1.3,  f: 0.2,  c: 5.2 },
  { code: "06-004", name: "ほうれん草（生）",             cat: "野菜類",       kcal: 20,  p: 2.2,  f: 0.4,  c: 3.1 },
  { code: "06-005", name: "玉ねぎ（生）",                 cat: "野菜類",       kcal: 37,  p: 1.0,  f: 0.1,  c: 8.4 },
  { code: "06-006", name: "にんじん（生）",               cat: "野菜類",       kcal: 39,  p: 0.7,  f: 0.2,  c: 9.3 },
  // 果実類
  { code: "07-001", name: "バナナ（生）",                 cat: "果実類",       kcal: 86,  p: 1.1,  f: 0.2,  c: 22.5 },
  { code: "07-002", name: "りんご（皮なし・生）",         cat: "果実類",       kcal: 61,  p: 0.2,  f: 0.2,  c: 16.2 },
  { code: "07-003", name: "みかん（生）",                 cat: "果実類",       kcal: 46,  p: 0.7,  f: 0.1,  c: 12.0 },
  // 豆類
  { code: "04-001", name: "木綿豆腐",                     cat: "豆類",         kcal: 72,  p: 6.6,  f: 4.2,  c: 1.6 },
  { code: "04-002", name: "絹ごし豆腐",                   cat: "豆類",         kcal: 56,  p: 4.9,  f: 3.0,  c: 2.0 },
  { code: "04-003", name: "納豆（糸引き）",               cat: "豆類",         kcal: 200, p: 16.5, f: 10.0, c: 12.1 },
  // 菓子類
  { code: "15-001", name: "カステラ",                     cat: "菓子類",       kcal: 319, p: 8.0,  f: 5.9,  c: 63.0 },
  { code: "15-002", name: "ポテトチップス",               cat: "菓子類",       kcal: 554, p: 4.7,  f: 35.2, c: 54.7 },
  // 飲料
  { code: "16-001", name: "コーヒー（インスタント）",     cat: "嗜好飲料類",   kcal: 4,   p: 0.2,  f: 0,    c: 0.7 },
  { code: "16-002", name: "緑茶（玉露）",                 cat: "嗜好飲料類",   kcal: 5,   p: 0.6,  f: 0.1,  c: 0.5 },
  // 調味料
  { code: "17-001", name: "しょうゆ（濃口）",             cat: "調味料・香辛料類", kcal: 71, p: 7.7, f: 0,  c: 10.1 },
  { code: "17-002", name: "マヨネーズ",                   cat: "調味料・香辛料類", kcal: 703, p: 1.5, f: 76.0, c: 3.4 },
  { code: "17-003", name: "みそ（淡色辛みそ）",           cat: "調味料・香辛料類", kcal: 198, p: 12.5, f: 6.0, c: 21.9 },
];

const ALIASES: Record<string, string[]> = {
  "01-001": ["白米", "ご飯", "白飯", "ごはん", "ライス"],
  "01-002": ["パン", "トースト", "しょくぱん"],
  "11-001": ["鶏むね肉", "チキンブレスト", "とりむね"],
  "11-002": ["鶏もも肉", "チキンモモ", "とりもも"],
  "10-001": ["鮭", "サーモン", "さけ"],
  "10-002": ["マグロ", "まぐろ", "ツナ"],
  "12-001": ["卵", "たまご", "生卵", "エッグ"],
  "13-001": ["牛乳", "ミルク", "ぎゅうにゅう"],
  "13-002": ["ヨーグルト", "ようぐると"],
  "06-001": ["ブロッコリー"],
  "06-002": ["トマト"],
  "07-001": ["バナナ"],
  "04-001": ["豆腐", "とうふ", "木綿豆腐"],
  "04-003": ["納豆", "なっとう"],
};

const SERVINGS: Record<string, Array<[string, number, number]>> = {
  "01-001": [["小盛り", 120, 1], ["普通", 150, 2], ["大盛り", 220, 3]],
  "01-002": [["1枚（薄切り）", 60, 1], ["1枚（厚切り）", 100, 2]],
  "12-001": [["1個（M）", 60, 1], ["1個（L）", 70, 2]],
  "07-001": [["1本", 100, 1], ["半分", 50, 2]],
  "13-002": [["1カップ", 210, 1], ["半カップ", 100, 2]],
  "04-001": [["1丁（300g）", 300, 1], ["半丁", 150, 2], ["1/4丁", 75, 3]],
  "04-003": [["1パック（50g）", 50, 1]],
};

async function seed() {
  console.log("🌱 食品データを投入中...");

  for (const f of FOODS) {
    const food = await prisma.genericFood.upsert({
      where: { foodCode: f.code },
      create: {
        foodCode: f.code,
        nameJa:   f.name,
        category: f.cat,
        caloriesKcal: f.kcal,
        proteinG: f.p,
        fatG:     f.f,
        carbG:    f.c,
        source:   "mext",
        // デフォルト 100g サービング
        servings: {
          create: [{ servingName: "100g", servingG: 100, sortOrder: 0 }],
        },
      },
      update: {
        nameJa:   f.name,
        category: f.cat,
        caloriesKcal: f.kcal,
        proteinG: f.p,
        fatG:     f.f,
        carbG:    f.c,
      },
    });

    // 追加サービング
    if (SERVINGS[f.code]) {
      for (const [name, g, order] of SERVINGS[f.code]) {
        await prisma.foodServing.upsert({
          where: {
            id: `${food.id}-${order}`,
          },
          create: {
            id: `${food.id}-${order}`,
            genericFoodId: food.id,
            servingName: name,
            servingG: g,
            sortOrder: order,
          },
          update: { servingName: name, servingG: g },
        });
      }
    }

    // エイリアス
    if (ALIASES[f.code]) {
      for (const alias of ALIASES[f.code]) {
        const exists = await prisma.foodAlias.findFirst({
          where: { alias, genericFoodId: food.id },
        });
        if (!exists) {
          await prisma.foodAlias.create({
            data: { alias, genericFoodId: food.id },
          });
        }
      }
    }
  }

  const count = await prisma.genericFood.count();
  console.log(`✅ 完了: GenericFood ${count} 件`);
}

seed()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
