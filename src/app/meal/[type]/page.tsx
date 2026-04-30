"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Food = {
  id: string;
  type: "generic" | "branded" | "user";
  name: string;
  category: string | null;
  caloriesKcal: number;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  source: string;
  servings: Array<{ serving_name: string; serving_g: number }>;
};

type MealItem = {
  foodId: string;
  foodType: "generic" | "branded" | "user";
  foodName: string;
  quantityG: number;
  calories: number;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  selectedServing: string;
  // 100gあたりの値（数量変更時の再計算用）
  kcalPer100g: number;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbPer100g: number | null;
};

type HistoryItem = {
  foodId: string;
  foodType: string;
  foodName: string;
  quantityG: number;
  calories: number;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
};

// ─── 定数 ────────────────────────────────────────────────────────────────────

const MEAL_LABELS: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: "朝食", emoji: "🌅" },
  lunch:     { label: "昼食", emoji: "☀️" },
  dinner:    { label: "夕食", emoji: "🌙" },
  snack:     { label: "間食", emoji: "🍪" },
};

// ─── ヘルパー ──────────────────────────────────────────────────────────────────

function r1(n: number) { return Math.round(n * 10) / 10; }

function recalcItem(item: MealItem, newG: number): MealItem {
  const g = Math.max(1, newG);
  return {
    ...item,
    quantityG: g,
    calories:  Math.round(item.kcalPer100g * g / 100),
    proteinG:  item.proteinPer100g != null ? r1(item.proteinPer100g * g / 100) : null,
    fatG:      item.fatPer100g     != null ? r1(item.fatPer100g     * g / 100) : null,
    carbG:     item.carbPer100g    != null ? r1(item.carbPer100g    * g / 100) : null,
  };
}

function foodToItem(food: Food): MealItem {
  const serving = food.servings[0];
  const g = serving?.serving_g ?? 100;
  const item: MealItem = {
    foodId:   food.id,
    foodType: food.type,
    foodName: food.name,
    quantityG: g,
    calories: 0,
    proteinG: null,
    fatG: null,
    carbG: null,
    selectedServing: serving?.serving_name ?? "100g",
    kcalPer100g:     food.caloriesKcal,
    proteinPer100g:  food.proteinG,
    fatPer100g:      food.fatG,
    carbPer100g:     food.carbG,
  };
  return recalcItem(item, g);
}

function historyToItem(h: HistoryItem): MealItem {
  const kcalPer100g = h.quantityG > 0 ? (h.calories / h.quantityG) * 100 : 0;
  const item: MealItem = {
    foodId:   h.foodId,
    foodType: h.foodType as MealItem["foodType"],
    foodName: h.foodName,
    quantityG: h.quantityG,
    calories:  h.calories,
    proteinG:  h.proteinG,
    fatG:      h.fatG,
    carbG:     h.carbG,
    selectedServing: `${h.quantityG}g`,
    kcalPer100g,
    proteinPer100g: h.proteinG && h.quantityG > 0 ? (h.proteinG / h.quantityG) * 100 : null,
    fatPer100g:     h.fatG     && h.quantityG > 0 ? (h.fatG     / h.quantityG) * 100 : null,
    carbPer100g:    h.carbG    && h.quantityG > 0 ? (h.carbG    / h.quantityG) * 100 : null,
  };
  return item;
}

function logItemToMealItem(raw: {
  foodId: string; foodType: string; foodName: string;
  quantityG: number; calories: number;
  proteinG: number | null; fatG: number | null; carbG: number | null;
}): MealItem {
  const kcalPer100g = raw.quantityG > 0 ? (raw.calories / raw.quantityG) * 100 : 0;
  return {
    foodId:   raw.foodId,
    foodType: raw.foodType as MealItem["foodType"],
    foodName: raw.foodName,
    quantityG: raw.quantityG,
    calories:  raw.calories,
    proteinG:  raw.proteinG,
    fatG:      raw.fatG,
    carbG:     raw.carbG,
    selectedServing: `${raw.quantityG}g`,
    kcalPer100g,
    proteinPer100g: raw.proteinG && raw.quantityG > 0 ? (raw.proteinG / raw.quantityG) * 100 : null,
    fatPer100g:     raw.fatG     && raw.quantityG > 0 ? (raw.fatG     / raw.quantityG) * 100 : null,
    carbPer100g:    raw.carbG    && raw.quantityG > 0 ? (raw.carbG    / raw.quantityG) * 100 : null,
  };
}

// ─── メイン ───────────────────────────────────────────────────────────────────

function MealEntryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mealType = params.type as string;
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const mealInfo = MEAL_LABELS[mealType] ?? { label: mealType, emoji: "🍽️" };

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState<MealItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 既存データ + 履歴を並行取得
  useEffect(() => {
    Promise.all([
      fetch(`/api/meals?date=${date}`).then((r) => r.json()),
      fetch("/api/meals/history").then((r) => r.json()),
    ]).then(([mealData, histData]) => {
      const log = (mealData.logs ?? []).find(
        (l: { mealType: string }) => l.mealType === mealType
      );
      if (log?.items?.length) {
        setItems(log.items.map(logItemToMealItem));
        setHasExisting(true);
      }
      setHistory(histData.items ?? []);
      setInitialLoaded(true);
    });
  }, [date, mealType]);

  // 検索（デバウンス 300ms）
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/foods?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data.foods);
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => search(query), 300);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [query, search]);

  // アクション
  function addFood(food: Food) {
    setItems((prev) => [...prev, foodToItem(food)]);
    setQuery("");
    setResults([]);
  }

  function addFromHistory(h: HistoryItem) {
    setItems((prev) => [...prev, historyToItem(h)]);
  }

  function changeQuantity(idx: number, delta: number) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? recalcItem(it, Math.round((it.quantityG + delta) / 1) * 1) : it
      )
    );
  }

  function setQuantityDirect(idx: number, raw: string) {
    const g = parseFloat(raw);
    if (!isNaN(g) && g > 0) {
      setItems((prev) => prev.map((it, i) => (i === idx ? recalcItem(it, g) : it)));
    }
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalCalories = items.reduce((s, i) => s + i.calories, 0);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType,
          logDate: date,
          items: items.map((it) => ({
            foodId:   it.foodId,
            foodType: it.foodType,
            foodName: it.foodName,
            quantityG: it.quantityG,
            calories:  it.calories,
            proteinG:  it.proteinG,
            fatG:      it.fatG,
            carbG:     it.carbG,
          })),
        }),
      });
      if (res.ok) router.push(`/dashboard?date=${date}`);
    } finally {
      setSaving(false);
    }
  }

  // 検索結果に既追加済みの食品を除くフィルタリング
  const filteredResults = results.filter(
    (f) => !items.some((it) => it.foodId === f.id)
  );

  // 履歴から現在itemsにないものだけ表示
  const filteredHistory = history.filter(
    (h) => !items.some((it) => it.foodId === h.foodId)
  );

  return (
    <div className="flex flex-col min-h-svh bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-pink-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 p-1">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-700 text-lg">
          {mealInfo.emoji} {mealInfo.label}
          {hasExisting && (
            <span className="ml-2 text-xs font-normal text-pink-400 bg-pink-50 px-2 py-0.5 rounded-full">
              記録あり
            </span>
          )}
        </h1>
      </header>

      <div className="flex-1 px-4 py-4 space-y-4 pb-36">
        {/* 検索 */}
        <div className="card">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              className="input-field pl-9"
              placeholder="食品名を検索（例：白米、鶏むね肉）"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {(filteredResults.length > 0 || searching) && (
            <div className="mt-2 border border-pink-100 rounded-xl overflow-hidden">
              {searching && (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">検索中...</div>
              )}
              {filteredResults.map((food) => (
                <button
                  key={`${food.type}-${food.id}`}
                  onClick={() => addFood(food)}
                  className="w-full px-4 py-3 text-left border-b border-pink-50 last:border-0 hover:bg-pink-50 active:bg-pink-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{food.name}</p>
                      {food.category && (
                        <p className="text-xs text-gray-400">{food.category}</p>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm font-bold text-pink-500">{food.caloriesKcal} kcal</p>
                      <p className="text-xs text-gray-400">/100g</p>
                    </div>
                  </div>
                  {(food.proteinG || food.fatG || food.carbG) && (
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      {food.proteinG && <span>P: {food.proteinG}g</span>}
                      {food.fatG && <span>F: {food.fatG}g</span>}
                      {food.carbG && <span>C: {food.carbG}g</span>}
                    </div>
                  )}
                </button>
              ))}
              {!searching && filteredResults.length === 0 && query && (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">
                  見つかりませんでした
                </div>
              )}
            </div>
          )}
        </div>

        {/* 入力履歴（クイック追加） */}
        {initialLoaded && filteredHistory.length > 0 && !query && (
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 px-1">よく使う食品</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {filteredHistory.map((h) => (
                <button
                  key={h.foodId}
                  onClick={() => addFromHistory(h)}
                  className="flex-shrink-0 bg-white border border-pink-100 rounded-xl px-3 py-2 text-left hover:border-pink-300 active:bg-pink-50 transition-colors"
                  style={{ minWidth: 120 }}
                >
                  <p className="text-xs font-medium text-gray-700 truncate" style={{ maxWidth: 110 }}>
                    {h.foodName}
                  </p>
                  <p className="text-xs text-pink-400 mt-0.5">{h.calories} kcal</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 追加済み食品リスト */}
        {items.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 px-1">
              {hasExisting ? "記録中の食品" : "追加した食品"}（{items.length}件）
            </h3>
            {items.map((item, idx) => (
              <div key={idx} className="card">
                <div className="flex justify-between items-start mb-2.5">
                  <p className="text-sm font-semibold text-gray-700 flex-1 mr-2">{item.foodName}</p>
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-gray-300 hover:text-red-400 flex-shrink-0 p-0.5"
                  >
                    ✕
                  </button>
                </div>

                {/* 数量 +/- コントロール */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeQuantity(idx, -10)}
                    className="w-9 h-9 rounded-full bg-pink-50 text-pink-500 font-bold text-lg flex items-center justify-center active:bg-pink-100"
                  >
                    −
                  </button>
                  <div className="flex items-center gap-1 flex-1 justify-center">
                    <input
                      type="number"
                      className="input-field w-20 text-center py-1.5 text-sm"
                      value={item.quantityG}
                      onChange={(e) => setQuantityDirect(idx, e.target.value)}
                      min="1"
                      step="5"
                    />
                    <span className="text-sm text-gray-400">g</span>
                  </div>
                  <button
                    onClick={() => changeQuantity(idx, 10)}
                    className="w-9 h-9 rounded-full bg-pink-50 text-pink-500 font-bold text-lg flex items-center justify-center active:bg-pink-100"
                  >
                    ＋
                  </button>
                  <span className="text-sm font-bold text-pink-500 w-16 text-right">
                    {item.calories} kcal
                  </span>
                </div>

                {(item.proteinG || item.fatG || item.carbG) && (
                  <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                    {item.proteinG != null && <span>P: {item.proteinG}g</span>}
                    {item.fatG     != null && <span>F: {item.fatG}g</span>}
                    {item.carbG    != null && <span>C: {item.carbG}g</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 記録なし表示（初回 & items 0） */}
        {initialLoaded && items.length === 0 && !query && (
          <div className="text-center py-8 text-gray-300">
            <p className="text-3xl mb-2">🍽️</p>
            <p className="text-sm">上の検索から食品を追加してください</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 px-4 py-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">合計カロリー</span>
          <span className="text-xl font-bold text-pink-500">
            {totalCalories.toLocaleString()} kcal
          </span>
        </div>
        <div className="flex justify-end">
          <button
            className="btn-primary"
            style={{ width: "auto", paddingLeft: "2rem", paddingRight: "2rem" }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "保存中..." : hasExisting ? "更新する ✓" : "完了 ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MealPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-svh">読み込み中...</div>
    }>
      <MealEntryContent />
    </Suspense>
  );
}
