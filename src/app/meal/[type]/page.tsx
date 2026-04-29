"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

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
};

const MEAL_LABELS: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: "朝食", emoji: "🌅" },
  lunch: { label: "昼食", emoji: "☀️" },
  dinner: { label: "夕食", emoji: "🌙" },
  snack: { label: "間食", emoji: "🍪" },
};

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
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
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
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, [query, search]);

  function addFood(food: Food) {
    const defaultServing = food.servings[0];
    const quantityG = defaultServing?.serving_g ?? 100;
    const calories = Math.round((food.caloriesKcal * quantityG) / 100);

    setItems((prev) => [
      ...prev,
      {
        foodId: food.id,
        foodType: food.type,
        foodName: food.name,
        quantityG,
        calories,
        proteinG: food.proteinG ? Math.round((food.proteinG * quantityG) / 100 * 10) / 10 : null,
        fatG: food.fatG ? Math.round((food.fatG * quantityG) / 100 * 10) / 10 : null,
        carbG: food.carbG ? Math.round((food.carbG * quantityG) / 100 * 10) / 10 : null,
        selectedServing: defaultServing?.serving_name ?? "100g",
      },
    ]);
    setQuery("");
    setResults([]);
  }

  function updateQuantity(idx: number, food: Food, g: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              quantityG: g,
              calories: Math.round((food.caloriesKcal * g) / 100),
              proteinG: food.proteinG ? Math.round((food.proteinG * g) / 100 * 10) / 10 : null,
              fatG: food.fatG ? Math.round((food.fatG * g) / 100 * 10) / 10 : null,
              carbG: food.carbG ? Math.round((food.carbG * g) / 100 * 10) / 10 : null,
            }
          : item
      )
    );
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalCalories = items.reduce((s, i) => s + i.calories, 0);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mealType,
        logDate: date,
        items: items.map((i) => ({
          foodId: i.foodId,
          foodType: i.foodType,
          foodName: i.foodName,
          quantityG: i.quantityG,
          calories: i.calories,
          proteinG: i.proteinG,
          fatG: i.fatG,
          carbG: i.carbG,
        })),
      }),
    });

    if (res.ok) {
      router.push(`/dashboard?date=${date}`);
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col min-h-svh">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-pink-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 p-1">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-700 text-lg">
          {mealInfo.emoji} {mealInfo.label}
        </h1>
      </header>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Search */}
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

          {/* Results */}
          {(results.length > 0 || searching) && (
            <div className="mt-2 border border-pink-100 rounded-xl overflow-hidden">
              {searching && (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">検索中...</div>
              )}
              {results.map((food) => (
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
                      <p className="text-sm font-bold text-pink-500">
                        {food.caloriesKcal} kcal
                      </p>
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
              {!searching && results.length === 0 && query && (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">
                  見つかりませんでした
                </div>
              )}
            </div>
          )}
        </div>

        {/* Added Items */}
        {items.length > 0 && (
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-gray-600">追加した食品（{items.length}件）</h3>
            {items.map((item, idx) => (
              <div key={idx} className="border border-pink-100 rounded-xl p-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-gray-700">{item.foodName}</p>
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-gray-300 hover:text-red-400 ml-2"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="input-field w-24 text-center py-1.5 text-sm"
                    value={item.quantityG}
                    onChange={(e) => {
                      const food = results.find((f) => f.id === item.foodId) ?? {
                        caloriesKcal: (item.calories / item.quantityG) * 100,
                        proteinG: item.proteinG ? (item.proteinG / item.quantityG) * 100 : null,
                        fatG: item.fatG ? (item.fatG / item.quantityG) * 100 : null,
                        carbG: item.carbG ? (item.carbG / item.quantityG) * 100 : null,
                      } as Food;
                      updateQuantity(idx, food, parseFloat(e.target.value) || 0);
                    }}
                    min="1"
                    step="5"
                  />
                  <span className="text-sm text-gray-400">g</span>
                  <span className="ml-auto text-sm font-bold text-pink-500">
                    {item.calories} kcal
                  </span>
                </div>
                {(item.proteinG || item.fatG || item.carbG) && (
                  <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                    {item.proteinG && <span>P: {item.proteinG}g</span>}
                    {item.fatG && <span>F: {item.fatG}g</span>}
                    {item.carbG && <span>C: {item.carbG}g</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-pink-100 px-4 py-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">合計カロリー</span>
          <span className="text-xl font-bold text-pink-500">{totalCalories.toLocaleString()} kcal</span>
        </div>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={items.length === 0 || saving}
        >
          {saving ? "保存中..." : "完了 ✓"}
        </button>
      </div>
    </div>
  );
}

export default function MealPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-svh">読み込み中...</div>}>
      <MealEntryContent />
    </Suspense>
  );
}
