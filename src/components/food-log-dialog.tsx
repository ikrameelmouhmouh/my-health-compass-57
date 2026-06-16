import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, ScanLine, Heart, Plus, X, ChevronLeft, Loader2, Flame,
  Minus, Trash2, Camera, Sparkles,
} from "lucide-react";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { useServerFn } from "@tanstack/react-start";
import { analyzeMealPhoto } from "@/lib/food-ai.functions";
import {
  searchFoods, lookupBarcode, computeNutrition,
  useFoodLibrary, MEAL_TYPES, inferMealType,
  type FoodItem, type FoodServing, type MealType,
} from "@/lib/food";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogged: (entry: {
    kcal: number; protein: number; carbs: number; fat: number;
    food: FoodItem; servingCount: number; serving: FoodServing; mealType: MealType;
  }) => void;
  defaultMealType?: MealType;
};

type Tab = "all" | "favorites" | "custom";

export function FoodLogDialog({ open, onOpenChange, onLogged, defaultMealType }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const analyzePhoto = useServerFn(analyzeMealPhoto);

  const { favorites, custom, toggleFavorite, isFavorite, addCustom, removeCustom } = useFoodLibrary();

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelected(null);
      setQuery("");
      setResults([]);
      setTab("all");
      setCustomOpen(false);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (tab !== "all") return;
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchFoods(q, ctrl.signal);
        setResults(r);
      } catch {} finally { setLoading(false); }
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query, tab]);

  async function handleBarcode(code: string) {
    setScanOpen(false);
    setLoading(true);
    try {
      const food = await lookupBarcode(code);
      if (food) setSelected(food);
      else alert(`Geen product gevonden voor barcode ${code}`);
    } finally { setLoading(false); }
  }

  async function handlePhotoSelected(file: File) {
    setAiError(null);
    setAiAnalyzing(true);
    try {
      // Downscale to keep payload small (~max 1024px, JPEG)
      const dataUrl = await downscaleToDataUrl(file, 1024, 0.85);
      const result = await analyzePhoto({ data: { imageDataUrl: dataUrl } });
      const grams = result.estimatedGrams;
      const food: FoodItem = {
        id: `ai:${Date.now()}`,
        name: result.name,
        brand: result.brand,
        per100: result.per100,
        servings: [
          { label: `AI portie (~${grams} g)`, grams },
          { label: "100 g", grams: 100 },
          { label: "1 g", grams: 1 },
        ],
        verified: false,
        source: "custom",
      };
      setSelected(food);
    } catch (e: any) {
      setAiError(e?.message || "Foto-analyse mislukt. Probeer het opnieuw.");
    } finally {
      setAiAnalyzing(false);
    }
  }

  const listToShow: FoodItem[] =
    tab === "favorites" ? favorites :
    tab === "custom" ? custom :
    results;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md gap-0 p-0 sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
          {selected ? (
            <FoodDetail
              food={selected}
              defaultMealType={defaultMealType ?? inferMealType()}
              onBack={() => setSelected(null)}
              onFav={() => toggleFavorite(selected)}
              isFav={isFavorite(selected.id)}
              onLog={(entry) => {
                onLogged(entry);
                onOpenChange(false);
              }}
            />
          ) : customOpen ? (
            <CustomFoodForm
              onBack={() => setCustomOpen(false)}
              onSave={(item) => {
                const saved = addCustom(item);
                setCustomOpen(false);
                setSelected(saved);
              }}
            />
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <button onClick={() => onOpenChange(false)} aria-label="Close">
                  <X className="size-5" />
                </button>
                <h2 className="font-display text-base font-semibold">Log food</h2>
                <button
                  onClick={() => setScanOpen(true)}
                  className="grid size-9 place-items-center rounded-full bg-brand text-brand-foreground"
                  aria-label="Scan barcode"
                >
                  <ScanLine className="size-4" />
                </button>
              </div>

              {/* Search */}
              <div className="px-4 pt-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Search products..."
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setTab("all"); }}
                    className="pl-9 rounded-full"
                  />
                </div>

                {/* Tabs */}
                <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                  <TabBtn active={tab === "all"} onClick={() => setTab("all")}>All products</TabBtn>
                  <TabBtn active={tab === "favorites"} onClick={() => setTab("favorites")}>
                    <Heart className="size-3.5" /> Favorites
                  </TabBtn>
                  <TabBtn active={tab === "custom"} onClick={() => setTab("custom")}>My foods</TabBtn>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {loading && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                  </div>
                )}
                {!loading && tab === "all" && query.trim().length < 2 && (
                  <EmptyHint icon="search" text="Type at least 2 characters to search the food database" />
                )}
                {!loading && listToShow.length === 0 && (tab !== "all" || query.trim().length >= 2) && (
                  <EmptyHint icon="empty" text={tab === "favorites" ? "No favorites yet. Tap the heart on any food." : tab === "custom" ? "No custom foods yet." : "No products found."} />
                )}
                <ul className="space-y-2">
                  {listToShow.map((f) => (
                    <li key={f.id}>
                      <button
                        onClick={() => setSelected(f)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition active:scale-[0.99] hover:bg-accent"
                      >
                        <FoodThumb food={f} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{f.name}</p>
                          {f.brand && <p className="truncate text-[11px] text-muted-foreground">{f.brand}</p>}
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            <span className="font-medium text-brand">{f.per100.kcal} kcal</span>
                            <span> · per 100g</span>
                          </p>
                        </div>
                        {isFavorite(f.id) && <Heart className="size-4 fill-brand text-brand" />}
                        {tab === "custom" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeCustom(f.id); }}
                            className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                            aria-label="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Add custom CTA */}
              <div className="border-t border-border bg-background p-3">
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => setCustomOpen(true)}
                >
                  <Plus className="size-4" /> Add custom food
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BarcodeScanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onDetected={handleBarcode}
      />
    </>
  );
}

/* ---------------- Detail screen ---------------- */
function FoodDetail({
  food, onBack, onFav, isFav, onLog, defaultMealType,
}: {
  food: FoodItem;
  onBack: () => void;
  onFav: () => void;
  isFav: boolean;
  defaultMealType: MealType;
  onLog: (entry: { kcal: number; protein: number; carbs: number; fat: number; food: FoodItem; servingCount: number; serving: FoodServing; mealType: MealType }) => void;
}) {
  const [servingIdx, setServingIdx] = useState(0);
  const [count, setCount] = useState("1");
  const [mealType, setMealType] = useState<MealType>(defaultMealType);

  const serving = food.servings[servingIdx] ?? food.servings[0];
  const n = Number(count.replace(",", ".")) || 0;
  const grams = serving.grams * n;
  const totals = computeNutrition(food.per100, grams);

  return (
    <div className="flex h-full max-h-[90vh] flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button onClick={onBack} aria-label="Back"><ChevronLeft className="size-5" /></button>
        <h2 className="truncate font-display text-sm font-semibold">{food.name}</h2>
        <button onClick={onFav} aria-label="Favorite">
          <Heart className={`size-5 ${isFav ? "fill-brand text-brand" : "text-muted-foreground"}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-3">
          <FoodThumb food={food} size={64} />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{food.name}</p>
            {food.brand && <p className="text-xs text-muted-foreground">{food.brand}</p>}
            {food.verified && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <Stat label="Cal" value={`${totals.kcal}`} accent />
          <Stat label="Carbs" value={`${totals.carbs}g`} />
          <Stat label="Protein" value={`${totals.protein}g`} />
          <Stat label="Fat" value={`${totals.fat}g`} />
        </div>

        {/* Portion */}
        <div className="mt-5 space-y-3">
          <div>
            <Label className="text-xs">Amount</Label>
            <div className="mt-1 flex items-center gap-2">
              <button
                onClick={() => setCount((c) => String(Math.max(0.25, (Number(c) || 0) - 0.5)))}
                className="grid size-10 place-items-center rounded-full border border-border"
                aria-label="Decrease"
              >
                <Minus className="size-4" />
              </button>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="text-center"
              />
              <button
                onClick={() => setCount((c) => String((Number(c) || 0) + 0.5))}
                className="grid size-10 place-items-center rounded-full border border-border"
                aria-label="Increase"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs">Serving</Label>
            <Select value={String(servingIdx)} onValueChange={(v) => setServingIdx(Number(v))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {food.servings.map((s, i) => (
                  <SelectItem key={i} value={String(i)}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              = {Math.round(grams)} g total
            </p>
          </div>

          <div>
            <Label className="text-xs">Meal</Label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.emoji} {m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Nutrition info */}
        <div className="mt-5 rounded-2xl border border-border p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Per 100g</p>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center text-[11px]">
            <div><p className="font-semibold">{food.per100.kcal}</p><p className="text-muted-foreground">kcal</p></div>
            <div><p className="font-semibold">{food.per100.carbs}g</p><p className="text-muted-foreground">carbs</p></div>
            <div><p className="font-semibold">{food.per100.protein}g</p><p className="text-muted-foreground">protein</p></div>
            <div><p className="font-semibold">{food.per100.fat}g</p><p className="text-muted-foreground">fat</p></div>
          </div>
        </div>
      </div>

      <div className="border-t border-border p-3">
        <Button
          className="w-full rounded-full"
          disabled={n <= 0}
          onClick={() => onLog({ ...totals, food, servingCount: n, serving, mealType })}
        >
          <Plus className="size-4" /> Add {totals.kcal} kcal
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Custom food form ---------------- */
function CustomFoodForm({
  onBack, onSave,
}: {
  onBack: () => void;
  onSave: (food: Omit<FoodItem, "id" | "source">) => void;
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [servingG, setServingG] = useState("100");

  const valid = name.trim() && Number(kcal) >= 0;

  return (
    <div className="flex max-h-[90vh] flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button onClick={onBack}><ChevronLeft className="size-5" /></button>
        <h2 className="font-display text-sm font-semibold">Add custom food</h2>
        <div className="size-5" />
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        <Field label="Name" value={name} onChange={setName} placeholder="e.g. Mom's lasagna" />
        <Field label="Brand (optional)" value={brand} onChange={setBrand} />
        <p className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Per 100g</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Calories" value={kcal} onChange={setKcal} type="number" />
          <Field label="Protein (g)" value={protein} onChange={setProtein} type="number" />
          <Field label="Carbs (g)" value={carbs} onChange={setCarbs} type="number" />
          <Field label="Fat (g)" value={fat} onChange={setFat} type="number" />
        </div>
        <Field label="1 serving = (g)" value={servingG} onChange={setServingG} type="number" />
      </div>
      <div className="border-t border-border p-3">
        <Button
          className="w-full rounded-full"
          disabled={!valid}
          onClick={() => onSave({
            name: name.trim(),
            brand: brand.trim() || undefined,
            per100: {
              kcal: Math.round(Number(kcal) || 0),
              protein: Number(protein) || 0,
              carbs: Number(carbs) || 0,
              fat: Number(fat) || 0,
            },
            servings: [
              { label: `1 serving (${Number(servingG) || 100} g)`, grams: Number(servingG) || 100 },
              { label: "100 g", grams: 100 },
              { label: "1 g", grams: 1 },
            ],
          })}
        >
          Save food
        </Button>
      </div>
    </div>
  );
}

/* ---------------- bits ---------------- */
function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
        active ? "bg-brand text-brand-foreground" : "bg-card border border-border text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function FoodThumb({ food, size = 44 }: { food: FoodItem; size?: number }) {
  if (food.imageUrl) {
    return (
      <img
        src={food.imageUrl}
        alt=""
        className="rounded-xl object-cover bg-muted shrink-0"
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className="grid place-items-center rounded-xl bg-brand/15 text-brand shrink-0"
      style={{ width: size, height: size }}
    >
      <Flame className="size-5" />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border border-border p-2 text-center ${accent ? "bg-brand/10" : ""}`}>
      <p className={`text-sm font-bold tabular-nums ${accent ? "text-brand" : ""}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyHint({ icon, text }: { icon: "search" | "empty"; text: string }) {
  return (
    <div className="grid place-items-center py-10 text-center text-muted-foreground">
      {icon === "search" ? <Search className="mb-2 size-8 opacity-40" /> : <Flame className="mb-2 size-8 opacity-40" />}
      <p className="px-8 text-xs">{text}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        className="mt-1"
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
