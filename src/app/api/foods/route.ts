import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const LIMIT = 20;
const FETCH = LIMIT * 2;

type GenericRow = {
  id: string;
  nameJa: string;
  nameKana: string | null;
  category: string | null;
  caloriesKcal: number;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  source: string;
  servings: { servingName: string; servingG: number }[];
};

type BrandedRow = {
  id: string;
  name: string;
  nameKana: string | null;
  category: string | null;
  restaurantChain: string | null;
  brand: string | null;
  caloriesKcal: number;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  servingSizeG: number | null;
};

// ─── テキスト正規化 ────────────────────────────────────────────────────────────

// 半角カタカナ → 全角カタカナ
function hankanaToZenkana(str: string): string {
  const map: Record<string, string> = {
    'ｦ':'ヲ','ｧ':'ァ','ｨ':'ィ','ｩ':'ゥ','ｪ':'ェ','ｫ':'ォ',
    'ｬ':'ャ','ｭ':'ュ','ｮ':'ョ','ｯ':'ッ','ｰ':'ー','ｱ':'ア',
    'ｲ':'イ','ｳ':'ウ','ｴ':'エ','ｵ':'オ','ｶ':'カ','ｷ':'キ',
    'ｸ':'ク','ｹ':'ケ','ｺ':'コ','ｻ':'サ','ｼ':'シ','ｽ':'ス',
    'ｾ':'セ','ｿ':'ソ','ﾀ':'タ','ﾁ':'チ','ﾂ':'ツ','ﾃ':'テ',
    'ﾄ':'ト','ﾅ':'ナ','ﾆ':'ニ','ﾇ':'ヌ','ﾈ':'ネ','ﾉ':'ノ',
    'ﾊ':'ハ','ﾋ':'ヒ','ﾌ':'フ','ﾍ':'ヘ','ﾎ':'ホ','ﾏ':'マ',
    'ﾐ':'ミ','ﾑ':'ム','ﾒ':'メ','ﾓ':'モ','ﾔ':'ヤ','ﾕ':'ユ',
    'ﾖ':'ヨ','ﾗ':'ラ','ﾘ':'リ','ﾙ':'ル','ﾚ':'レ','ﾛ':'ロ',
    'ﾜ':'ワ','ﾝ':'ン',
  };
  return str.replace(/[ｦ-ﾟ]/g, (c) => map[c] ?? c);
}

// 全角英数 → 半角
function toHalfWidth(str: string): string {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );
}

// カタカナ → ひらがな
function kanaToHira(str: string): string {
  return str.replace(/[ァ-ヶ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );
}

// クエリを正規化（半角カナ→全角→ひらがな→半角英数→小文字）
function normalize(str: string): string {
  return kanaToHira(toHalfWidth(hankanaToZenkana(str))).toLowerCase();
}

// ─── 関連度スコア ─────────────────────────────────────────────────────────────

function relevanceScore(
  name: string,
  kana: string | null,
  q: string,
  qNorm: string
): number {
  const n = name.toLowerCase();
  const k = kana?.toLowerCase() ?? "";
  const kNorm = normalize(kana ?? "");
  if (n === q || k === q || kNorm === qNorm) return 0;             // 完全一致
  if (n.startsWith(q) || kNorm.startsWith(qNorm)) return 1;       // 前方一致
  return 2;                                                         // 部分一致
}

// ─── API ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("q")?.trim();
  if (!raw || raw.length < 1) return NextResponse.json({ foods: [] });

  const q     = raw;
  const qNorm = normalize(raw);

  // 重複条件を避けるため、正規化後が元と異なる場合だけ追加
  const nameJaOR = qNorm !== q.toLowerCase()
    ? [
        { nameJa:   { contains: q,     mode: "insensitive" as const } },
        { nameJa:   { contains: qNorm, mode: "insensitive" as const } },
        { nameKana: { contains: qNorm, mode: "insensitive" as const } },
      ]
    : [
        { nameJa:   { contains: q,     mode: "insensitive" as const } },
        { nameKana: { contains: qNorm, mode: "insensitive" as const } },
      ];

  const nameOR = qNorm !== q.toLowerCase()
    ? [
        { name:     { contains: q,     mode: "insensitive" as const } },
        { name:     { contains: qNorm, mode: "insensitive" as const } },
        { nameKana: { contains: qNorm, mode: "insensitive" as const } },
      ]
    : [
        { name:     { contains: q,     mode: "insensitive" as const } },
        { nameKana: { contains: qNorm, mode: "insensitive" as const } },
      ];

  const [generics, branded] = await Promise.all([
    prisma.genericFood.findMany({
      where: { OR: nameJaOR },
      take: FETCH,
      select: {
        id: true,
        nameJa: true,
        nameKana: true,
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
    }) as Promise<GenericRow[]>,
    prisma.brandedFood.findMany({
      where: { OR: nameOR },
      take: FETCH,
      select: {
        id: true,
        name: true,
        nameKana: true,
        category: true,
        restaurantChain: true,
        brand: true,
        caloriesKcal: true,
        proteinG: true,
        fatG: true,
        carbG: true,
        servingSizeG: true,
      },
    }) as Promise<BrandedRow[]>,
  ]);

  const genericFoods = generics.map((f: GenericRow) => ({
    id: f.id,
    type: "generic" as const,
    name: f.nameJa,
    nameKana: f.nameKana,
    category: f.category,
    caloriesKcal: f.caloriesKcal,
    proteinG: f.proteinG,
    fatG: f.fatG,
    carbG: f.carbG,
    source: f.source,
    servings: f.servings.map((s: { servingName: string; servingG: number }) => ({
      serving_name: s.servingName,
      serving_g: s.servingG,
    })),
    _score: relevanceScore(f.nameJa, f.nameKana, q, qNorm),
  }));

  const brandedFoods = branded.map((f: BrandedRow) => ({
    id: f.id,
    type: "branded" as const,
    name: f.name,
    nameKana: f.nameKana,
    category: f.category ?? f.restaurantChain ?? f.brand ?? null,
    caloriesKcal: f.caloriesKcal,
    proteinG: f.proteinG,
    fatG: f.fatG,
    carbG: f.carbG,
    source: "branded",
    servings: f.servingSizeG
      ? [{ serving_name: "1食分", serving_g: f.servingSizeG }]
      : [],
    _score: relevanceScore(f.name, f.nameKana, q, qNorm),
  }));

  const foods = [...genericFoods, ...brandedFoods]
    .sort((a, b) => a._score - b._score)
    .slice(0, LIMIT)
    .map(({ _score, nameKana, ...rest }) => rest);

  return NextResponse.json({ foods });
}
