"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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

type SelectedFood = {
  foodId: string;
  foodType: "generic" | "branded" | "user";
  foodName: string;
  quantity: number;
  servingIdx: number;
  servings: Array<{ serving_name: string; serving_g: number }>;
  kcalPer100g: number;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbPer100g: number | null;
};

type RawItem = {
  foodId: string;
  foodType: string;
  foodName: string;
  quantityG: number;
  calories: number;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
};

type BlockState = {
  text: string;
  results: Food[];
  searching: boolean;
  selected: SelectedFood | null;
};

// ─── 定数 ─────────────────────────────────────────────────────────────────────

const MEAL_LABELS: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: "朝食", emoji: "🌅" },
  lunch:     { label: "昼食", emoji: "☀️" },
  dinner:    { label: "夕食", emoji: "🌙" },
  snack:     { label: "間食", emoji: "🍪" },
};

const INPUT_COUNT = 10;

// ─── ヘルパー ──────────────────────────────────────────────────────────────────

function r1(n: number) { return Math.round(n * 10) / 10; }

function sfServing(sf: SelectedFood) {
  return sf.servings[sf.servingIdx] ?? { serving_name: "100g", serving_g: 100 };
}
function sfCalories(sf: SelectedFood) {
  return Math.round(sf.kcalPer100g * sf.quantity * sfServing(sf).serving_g / 100);
}
function sfProtein(sf: SelectedFood): number | null {
  if (sf.proteinPer100g == null) return null;
  return r1(sf.proteinPer100g * sf.quantity * sfServing(sf).serving_g / 100);
}
function sfFat(sf: SelectedFood): number | null {
  if (sf.fatPer100g == null) return null;
  return r1(sf.fatPer100g * sf.quantity * sfServing(sf).serving_g / 100);
}
function sfCarb(sf: SelectedFood): number | null {
  if (sf.carbPer100g == null) return null;
  return r1(sf.carbPer100g * sf.quantity * sfServing(sf).serving_g / 100);
}

function foodToSelected(food: Food): SelectedFood {
  const servings = food.servings.length > 0
    ? food.servings
    : [{ serving_name: "100g", serving_g: 100 }];
  return {
    foodId: food.id, foodType: food.type, foodName: food.name,
    quantity: 1, servingIdx: 0, servings,
    kcalPer100g: food.caloriesKcal,
    proteinPer100g: food.proteinG, fatPer100g: food.fatG, carbPer100g: food.carbG,
  };
}

function rawToSelected(raw: RawItem): SelectedFood {
  const g = raw.quantityG || 100;
  return {
    foodId: raw.foodId, foodType: raw.foodType as SelectedFood["foodType"],
    foodName: raw.foodName, quantity: 1, servingIdx: 0,
    servings: [{ serving_name: `${g}g`, serving_g: g }],
    kcalPer100g: raw.quantityG > 0 ? (raw.calories / raw.quantityG) * 100 : 0,
    proteinPer100g: raw.proteinG && raw.quantityG > 0 ? (raw.proteinG / raw.quantityG) * 100 : null,
    fatPer100g:     raw.fatG     && raw.quantityG > 0 ? (raw.fatG     / raw.quantityG) * 100 : null,
    carbPer100g:    raw.carbG    && raw.quantityG > 0 ? (raw.carbG    / raw.quantityG) * 100 : null,
  };
}

// ─── Numpad ───────────────────────────────────────────────────────────────────

type NumpadProps = {
  label: string; value: string;
  onValue: (v: string) => void;
  onConfirm: () => void; onClose: () => void;
};

function Numpad({ label, value, onValue, onConfirm, onClose }: NumpadProps) {
  function press(key: string) {
    if (key === "⌫") { onValue(value.slice(0, -1)); return; }
    if (value === "" && key === "0") return;
    const next = value + key;
    if (parseInt(next, 10) > 999) return;
    onValue(next);
  }
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-2xl shadow-2xl px-4 pt-4 pb-8" onClick={(e) => e.stopPropagation()}>
        <p className="text-center text-sm text-gray-500 mb-1 truncate px-4">{label}</p>
        <div className="text-center text-4xl font-bold text-pink-500 mb-4 py-2 border-b border-pink-100">
          {value || "0"}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {["7","8","9","4","5","6","1","2","3","0","","⌫"].map((k, i) => (
            <button key={i} onClick={() => k && press(k)} disabled={!k}
              className={`h-14 rounded-xl text-xl font-semibold transition-colors ${
                k === "⌫" ? "bg-pink-50 text-pink-400 active:bg-pink-100"
                : k === "" ? "opacity-0 pointer-events-none"
                : "bg-gray-100 text-gray-700 active:bg-gray-200"
              }`}
            >{k}</button>
          ))}
        </div>
        <button onClick={onConfirm}
          className="w-full h-12 rounded-xl font-bold text-lg text-white"
          style={{ background: "linear-gradient(135deg, #f9a8d4, #f05a9e)" }}
        >決定</button>
      </div>
    </div>
  );
}

// ─── メイン ───────────────────────────────────────────────────────────────────

function MealEntryContent() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const mealType     = params.type as string;
  const date         = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const mealInfo     = MEAL_LABELS[mealType] ?? { label: mealType, emoji: "🍽️" };

  // ── フェーズ管理 ─────────────────────────────────────────────────────────────
  const [phase, setPhase]       = useState<"input" | "select">("input");

  // input フェーズ
  const [inputTexts, setInputTexts] = useState<string[]>(Array(INPUT_COUNT).fill(""));

  // select フェーズ
  const [blocks, setBlocks]     = useState<BlockState[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  // 共通
  const [history, setHistory]   = useState<RawItem[]>([]);
  const [hasExisting, setHasExisting] = useState(false);
  const [numpadTarget, setNumpadTarget] = useState<number | null>(null);
  const [numpadValue, setNumpadValue]   = useState("");
  const [saving, setSaving]     = useState(false);

  const inputRefs    = useRef<(HTMLInputElement | null)[]>(Array(INPUT_COUNT).fill(null));
  const blockRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // ── 初期データ読み込み ─────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch(`/api/meals?date=${date}`).then((r) => r.json()),
      fetch(`/api/meals/history?mealType=${mealType}`).then((r) => r.json()),
    ]).then(([mealData, histData]) => {
      const log = (mealData.logs ?? []).find(
        (l: { mealType: string }) => l.mealType === mealType
      );
      if (log?.items?.length) {
        const newBlocks: BlockState[] = (log.items as RawItem[])
          .slice(0, INPUT_COUNT)
          .map((item) => ({
            text: item.foodName,
            results: [],
            searching: false,
            selected: rawToSelected(item),
          }));
        setBlocks(newBlocks);
        setActiveIdx(newBlocks.length); // 全選択済み → 末尾を指す
        setHasExisting(true);
        setPhase("select");
      }
      setHistory(histData.items ?? []);
    });
  }, [date, mealType]);

  // ── 検索（選択フェーズ・activeIdx 変化時に自動実行）────────────────────────

  useEffect(() => {
    if (phase !== "select") return;
    const idx = activeIdx;
    const q   = blocks[idx]?.text?.trim() ?? "";
    if (!q) return;

    let cancelled = false;
    setBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, searching: true } : b));

    const timer = setTimeout(async () => {
      if (cancelled) return;
      const res = await fetch(`/api/foods?q=${encodeURIComponent(q)}`);
      if (!cancelled && res.ok) {
        const data = await res.json();
        setBlocks((prev) => prev.map((b, i) =>
          i === idx ? { ...b, results: data.foods, searching: false } : b
        ));
      } else if (!cancelled) {
        setBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, searching: false } : b));
      }
    }, 200);

    return () => { cancelled = true; clearTimeout(timer); };
  // blocks[idx].text は select フェーズ中に変わらないので deps から除外
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, activeIdx]);

  // ── input フェーズ → select フェーズ ────────────────────────────────────────

  function handleStartSelect() {
    const nonEmpty = inputTexts.map((t) => t.trim()).filter(Boolean);
    if (nonEmpty.length === 0) return;
    setBlocks(nonEmpty.map((text) => ({ text, results: [], searching: false, selected: null })));
    setActiveIdx(0);
    setPhase("select");
  }

  // ── select フェーズ内アクション ─────────────────────────────────────────────

  function advanceTo(nextIdx: number) {
    if (nextIdx >= blocks.length) return;
    setActiveIdx(nextIdx);
    setTimeout(() => {
      blockRefs.current[nextIdx]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  }

  function selectFood(i: number, food: Food) {
    setBlocks((prev) => prev.map((b, idx) =>
      idx === i ? { ...b, selected: foodToSelected(food), searching: false } : b
    ));
    advanceTo(i + 1);
  }

  function selectHistory(i: number, h: RawItem) {
    setBlocks((prev) => prev.map((b, idx) =>
      idx === i ? { ...b, selected: rawToSelected(h), searching: false } : b
    ));
    advanceTo(i + 1);
  }

  function clearFood(i: number) {
    setBlocks((prev) => prev.map((b, idx) =>
      idx === i ? { ...b, selected: null } : b
    ));
    setActiveIdx(i);
  }

  function cycleServing(i: number) {
    setBlocks((prev) => prev.map((b, idx) => {
      if (idx !== i || !b.selected) return b;
      const sf = b.selected;
      return { ...b, selected: { ...sf, servingIdx: (sf.servingIdx + 1) % sf.servings.length } };
    }));
  }

  function openNumpad(i: number) {
    setNumpadTarget(i);
    setNumpadValue("");
  }

  function confirmNumpad() {
    if (numpadTarget === null) return;
    const qty = Math.max(1, parseInt(numpadValue, 10) || 1);
    setBlocks((prev) => prev.map((b, i) =>
      i === numpadTarget && b.selected ? { ...b, selected: { ...b.selected, quantity: qty } } : b
    ));
    setNumpadTarget(null);
    setNumpadValue("");
  }

  // ── 保存 ───────────────────────────────────────────────────────────────────

  const selectedFoods = blocks.map((b) => b.selected).filter((s): s is SelectedFood => s !== null);
  const totalCalories = selectedFoods.reduce((s, sf) => s + sfCalories(sf), 0);

  async function handleSave() {
    if (selectedFoods.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType, logDate: date,
          items: selectedFoods.map((sf) => {
            const quantityG = Math.round(sf.quantity * sfServing(sf).serving_g);
            return {
              foodId: sf.foodId, foodType: sf.foodType, foodName: sf.foodName,
              quantityG, calories: sfCalories(sf),
              proteinG: sfProtein(sf), fatG: sfFat(sf), carbG: sfCarb(sf),
            };
          }),
        }),
      });
      if (res.ok) router.push(`/dashboard?date=${date}`);
    } finally {
      setSaving(false);
    }
  }

  // ── 検索結果フィルタ（アクティブブロック用）────────────────────────────────

  const activeText = phase === "select" ? (blocks[activeIdx]?.text ?? "").toLowerCase() : "";
  const historyMatches = activeText
    ? history.filter((h) => h.foodName.toLowerCase().includes(activeText)).slice(0, 3)
    : [];
  const histMatchIds  = new Set(historyMatches.map((h) => h.foodId));
  const activeResults = (blocks[activeIdx]?.results ?? [])
    .filter((f) => !histMatchIds.has(f.id))
    .slice(0, 8);

  // ── レンダリング ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-svh bg-gray-50">

      {/* ══ INPUT フェーズ ══════════════════════════════════════════════════════ */}
      {phase === "input" && (
        <>
          <header className="sticky top-0 z-10 bg-white border-b border-pink-100 px-4 py-3 flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 p-1">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 className="font-bold text-gray-700 text-lg">{mealInfo.emoji} {mealInfo.label}</h1>
          </header>

          <div className="flex-1 px-4 py-4 pb-32">
            <p className="text-sm text-gray-400 mb-3">食べたものを入力してください（最大{INPUT_COUNT}件）</p>
            <div className="card space-y-2.5">
              {inputTexts.map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-300 w-5 text-right flex-shrink-0">{i + 1}</span>
                  <input
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="text"
                    className="input-field flex-1 py-2 text-sm"
                    placeholder={i === 0 ? "例：白米、鶏むね肉" : "食品名を入力"}
                    value={text}
                    onChange={(e) => {
                      const next = [...inputTexts];
                      next[i] = e.target.value;
                      setInputTexts(next);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      if (i < INPUT_COUNT - 1) {
                        inputRefs.current[i + 1]?.focus();
                      } else if (inputTexts.some((t) => t.trim())) {
                        handleStartSelect();
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-pink-100 px-4 py-3">
            <button
              className="btn-primary w-full py-3 text-base"
              onClick={handleStartSelect}
              disabled={inputTexts.every((t) => !t.trim())}
            >
              検索・選択する →
            </button>
          </div>
        </>
      )}

      {/* ══ SELECT フェーズ ═════════════════════════════════════════════════════ */}
      {phase === "select" && (
        <>
          <header className="sticky top-0 z-10 bg-white border-b border-pink-100 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => hasExisting ? router.back() : setPhase("input")}
              className="text-gray-400 p-1"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 className="font-bold text-gray-700 text-lg flex-1">
              {mealInfo.emoji} {mealInfo.label}
              {hasExisting && (
                <span className="ml-2 text-xs font-normal text-pink-400 bg-pink-50 px-2 py-0.5 rounded-full">
                  記録あり
                </span>
              )}
            </h1>
          </header>

          <div className="flex-1 px-4 py-3 space-y-2 pb-36">
            {blocks.map((block, i) => {
              const isActive = activeIdx === i && !block.selected;
              const showResults = isActive &&
                (block.searching || historyMatches.length > 0 || activeResults.length > 0);

              return (
                <div
                  key={i}
                  ref={(el) => { blockRefs.current[i] = el; }}
                  className={`card transition-all ${
                    isActive ? "border-2 border-pink-300" : "border border-pink-50"
                  }`}
                >
                  {/* ブロックヘッダー */}
                  <div
                    className="flex items-center gap-2 mb-1.5 cursor-pointer"
                    onClick={() => { if (!block.selected) setActiveIdx(i); }}
                  >
                    <span className={`text-xs w-5 text-right flex-shrink-0 font-bold ${
                      block.selected ? "text-pink-400" : isActive ? "text-pink-500" : "text-gray-300"
                    }`}>
                      {i + 1}
                    </span>
                    <p className={`text-sm font-medium flex-1 ${
                      block.selected ? "text-gray-700" : isActive ? "text-gray-800" : "text-gray-400"
                    }`}>
                      {block.text}
                    </p>
                    {block.selected && (
                      <button
                        onClick={(e) => { e.stopPropagation(); clearFood(i); }}
                        className="text-gray-300 hover:text-red-400 px-1 flex-shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* 選択済み：個数コントロール */}
                  {block.selected && (() => {
                    const sf = block.selected;
                    const { serving_name, serving_g } = sfServing(sf);
                    const p = sfProtein(sf); const f = sfFat(sf); const c = sfCarb(sf);
                    return (
                      <div className="ml-7">
                        <div className="flex items-center gap-2">
                          {sf.servings.length > 1 ? (
                            <button
                              onClick={() => cycleServing(i)}
                              className="flex-shrink-0 bg-pink-50 text-pink-500 text-xs px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap"
                            >
                              {serving_name} ▾
                            </button>
                          ) : (
                            <span className="flex-shrink-0 bg-gray-50 text-gray-500 text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                              {serving_name}
                            </span>
                          )}
                          <button
                            onClick={() => openNumpad(i)}
                            className="w-14 h-9 bg-white border-2 border-pink-200 rounded-xl text-center text-base font-bold text-gray-700 flex-shrink-0 active:border-pink-400 active:bg-pink-50"
                          >
                            {sf.quantity}
                          </button>
                          <span className="text-xs text-gray-400 flex-shrink-0">× {serving_g}g</span>
                          <span className="ml-auto text-sm font-bold text-pink-500 flex-shrink-0">
                            {sfCalories(sf)} kcal
                          </span>
                        </div>
                        {(p != null || f != null || c != null) && (
                          <div className="flex gap-3 mt-1 text-xs text-gray-400">
                            {p != null && <span>P: {p}g</span>}
                            {f != null && <span>F: {f}g</span>}
                            {c != null && <span>C: {c}g</span>}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* アクティブ：検索結果 */}
                  {isActive && (
                    <div className="ml-7 mt-2">
                      {block.searching && !showResults && (
                        <div className="text-center py-4 text-sm text-gray-400">検索中...</div>
                      )}

                      {showResults && (
                        <div className="border border-pink-100 rounded-xl overflow-hidden">
                          {block.searching && (
                            <div className="px-4 py-2 text-xs text-gray-400 text-center border-b border-pink-50">
                              検索中...
                            </div>
                          )}

                          {historyMatches.map((h) => (
                            <button
                              key={`hist-${h.foodId}`}
                              onClick={() => selectHistory(i, h)}
                              className="w-full px-4 py-3 text-left flex justify-between items-center border-b border-pink-50 last:border-0 hover:bg-pink-50 active:bg-pink-100"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs text-pink-400 flex-shrink-0 bg-pink-50 px-1.5 py-0.5 rounded">履歴</span>
                                <p className="text-sm font-medium text-gray-700 truncate">{h.foodName}</p>
                              </div>
                              <p className="text-sm font-bold text-pink-500 ml-3 flex-shrink-0">{h.calories} kcal</p>
                            </button>
                          ))}

                          {activeResults.map((food) => (
                            <button
                              key={`${food.type}-${food.id}`}
                              onClick={() => selectFood(i, food)}
                              className="w-full px-4 py-3 text-left border-b border-pink-50 last:border-0 hover:bg-pink-50 active:bg-pink-100"
                            >
                              <div className="flex justify-between items-start">
                                <div className="min-w-0 flex-1 mr-3">
                                  <p className="text-sm font-medium text-gray-700">{food.name}</p>
                                  {food.category && (
                                    <p className="text-xs text-gray-400">{food.category}</p>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-bold text-pink-500">{food.caloriesKcal} kcal</p>
                                  <p className="text-xs text-gray-400">
                                    {food.servings[0] ? `/${food.servings[0].serving_name}` : "/100g"}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}

                          {!block.searching && historyMatches.length === 0 && activeResults.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">
                              見つかりませんでした
                            </div>
                          )}
                        </div>
                      )}

                      {/* スキップ */}
                      {i < blocks.length - 1 && (
                        <button
                          onClick={() => advanceTo(i + 1)}
                          className="mt-2 text-xs text-gray-400 w-full text-right pr-1"
                        >
                          スキップ →
                        </button>
                      )}
                    </div>
                  )}

                  {/* 未選択・非アクティブ */}
                  {!block.selected && !isActive && (
                    <p className="ml-7 text-xs text-gray-400">タップして選択</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-pink-100 px-4 py-3 flex items-center gap-3">
            <span className="text-sm text-gray-500 flex-shrink-0">合計</span>
            <span className="text-lg font-bold text-pink-500 flex-1">
              {totalCalories.toLocaleString()} kcal
            </span>
            <button
              ref={saveButtonRef}
              className="btn-primary flex-shrink-0"
              style={{ width: "auto", padding: "0.6rem 1.5rem", fontSize: "0.9rem" }}
              onClick={handleSave}
              disabled={saving || selectedFoods.length === 0}
            >
              {saving ? "保存中..." : hasExisting ? "更新する ✓" : "完了 ✓"}
            </button>
          </div>
        </>
      )}

      {/* Numpad */}
      {numpadTarget !== null && (
        <Numpad
          label={blocks[numpadTarget]?.selected?.foodName ?? ""}
          value={numpadValue}
          onValue={setNumpadValue}
          onConfirm={confirmNumpad}
          onClose={() => setNumpadTarget(null)}
        />
      )}
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
