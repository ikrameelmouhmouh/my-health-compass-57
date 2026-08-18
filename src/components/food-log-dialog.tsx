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
import { useI18n } from "@/lib/i18n";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogged: (entry: {
    kcal: number; protein: number; carbs: number; fat: number;
    food: FoodItem; servingCount: number; serving: FoodServing; mealType: MealType;
  }) => void;
  defaultMealType?: MealType;
  autoOpenScan?: boolean;
};

type Tab = "all" | "favorites" | "custom";

export function FoodLogDialog({ open, onOpenChange, onLogged, defaultMealType, autoOpenScan }: Props) {
  const { t } = useI18n();
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

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setQuery("");
      setResults([]);
      setTab("all");
      setCustomOpen(false);
    } else if (autoOpenScan) {
      setScanOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoOpenScan]);

  useEffect(() => {
    if (tab !== "all") return;
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const ctrl = new AbortController();
    setLoading(true);
    const tm = setTimeout(async () => {
      try {
        const r = await searchFoods(q, ctrl.signal);
        setResults(r);
      } catch {} finally { setLoading(false); }
    }, 350);
    return () => { clearTimeout(tm); ctrl.abort(); };
  }, [query, tab]);

  async function handleBarcode(code: string) {
    setScanOpen(false);
    setLoading(true);
    try {
      const food = await lookupBarcode(code);
      if (food) setSelected(food);
      else alert(t("food.no_barcode", { code }));
    } finally { setLoading(false); }
  }

  async function handlePhotoSelected(file: File) {
    setAiError(null);
    setAiAnalyzing(true);
    try {
      const dataUrl = await downscaleToDataUrl(file, 1024, 0.85);
      const result = await analyzePhoto({ data: { imageDataUrl: dataUrl } });
      const grams = result.estimatedGrams;
      const food: FoodItem = {
        id: `ai:${Date.now()}`,
        name: result.name,
        brand: result.brand,
        per100: result.per100,
        servings: [
          { label: t("food.ai_serving", { g: grams }), grams },
          { label: t("food.serving_100"), grams: 100 },
          { label: t("food.serving_1"), grams: 1 },
        ],
        verified: false,
        source: "custom",
      };
      setSelected(food);
    } catch (e: any) {
      setAiError(e?.message || t("food.ai_failed"));
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
        <DialogContent hideClose className="max-w-md gap-0 p-0 sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
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
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="w-[72px]" aria-hidden />
                <h2 className="font-display text-base font-semibold">{t("food.title")}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={aiAnalyzing}
                    className="grid size-9 place-items-center rounded-full bg-brand/15 text-brand disabled:opacity-50"
                    aria-label={t("food.ai_aria")}
                    title={t("food.ai_aria")}
                  >
                    {aiAnalyzing ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                  </button>
                  <button
                    onClick={() => setScanOpen(true)}
                    className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"
                    aria-label={t("food.scan_aria")}
                  >
                    <ScanLine className="size-4" />
                  </button>
                </div>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) handlePhotoSelected(f);
                }}
              />
              {aiAnalyzing && (
                <div className="flex items-center gap-2 border-b border-border bg-brand/5 px-4 py-2 text-xs text-brand">
                  <Sparkles className="size-3.5 animate-pulse" />
                  {t("food.ai_analyzing")}
                </div>
              )}
              {aiError && (
                <div className="border-b border-border bg-destructive/10 px-4 py-2 text-xs text-destructive">
                  {aiError}
                </div>
              )}

              <div className="px-4 pt-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder={t("food.search_placeholder")}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setTab("all"); }}
                    className="pl-9 rounded-full"
                  />
                </div>

                <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                  <TabBtn active={tab === "all"} onClick={() => setTab("all")}>{t("food.tab_all")}</TabBtn>
                  <TabBtn active={tab === "favorites"} onClick={() => setTab("favorites")}>
                    <Heart className="size-3.5" /> {t("food.tab_favs")}
                  </TabBtn>
                  <TabBtn active={tab === "custom"} onClick={() => setTab("custom")}>{t("food.tab_custom")}</TabBtn>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                {loading && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                  </div>
                )}
                {!loading && tab === "all" && query.trim().length < 2 && (
                  <EmptyHint icon="search" text={t("food.hint_search")} />
                )}
                {!loading && listToShow.length === 0 && (tab !== "all" || query.trim().length >= 2) && (
                  <EmptyHint
                    icon="empty"
                    text={tab === "favorites" ? t("food.hint_no_favs") : tab === "custom" ? t("food.hint_no_custom") : t("food.hint_no_results")}
                  />
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
                            <span className="font-medium text-brand">{f.per100.kcal} {t("food.kcal")}</span>
                            <span> · {t("food.per100").toLowerCase()}</span>
                          </p>
                        </div>
                        {isFavorite(f.id) && <Heart className="size-4 fill-brand text-brand" />}
                        {tab === "custom" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeCustom(f.id); }}
                            className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                            aria-label={t("food.delete")}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-border bg-background p-3">
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => setCustomOpen(true)}
                >
                  <Plus className="size-4" /> {t("food.add_custom")}
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
  const { t } = useI18n();
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
        <button onClick={onBack} aria-label={t("food.back")}><ChevronLeft className="size-5" /></button>
        <h2 className="truncate font-display text-sm font-semibold">{food.name}</h2>
        <button onClick={onFav} aria-label={t("food.fav")}>
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
                ✓ {t("food.verified")}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <Stat label={t("food.cal")} value={`${totals.kcal}`} accent />
          <Stat label={t("food.carbs")} value={`${totals.carbs}g`} />
          <Stat label={t("food.protein")} value={`${totals.protein}g`} />
          <Stat label={t("food.fat")} value={`${totals.fat}g`} />
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <Label className="text-xs">{t("food.amount")}</Label>
            <div className="mt-1 flex items-center gap-2">
              <button
                onClick={() => setCount((c) => String(Math.max(0.25, (Number(c) || 0) - 0.5)))}
                className="grid size-10 place-items-center rounded-full border border-border"
                aria-label={t("food.dec")}
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
                aria-label={t("food.inc")}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs">{t("food.serving")}</Label>
            <Select value={String(servingIdx)} onValueChange={(v) => setServingIdx(Number(v))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {food.servings.map((s, i) => (
                  <SelectItem key={i} value={String(i)}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("food.serving_total", { g: Math.round(grams) })}
            </p>
          </div>

          <div>
            <Label className="text-xs">{t("food.meal")}</Label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.emoji} {t(`meal.${m.id}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("food.per100")}</p>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center text-[11px]">
            <div><p className="font-semibold">{food.per100.kcal}</p><p className="text-muted-foreground">{t("food.kcal")}</p></div>
            <div><p className="font-semibold">{food.per100.carbs}g</p><p className="text-muted-foreground">{t("food.carbs").toLowerCase()}</p></div>
            <div><p className="font-semibold">{food.per100.protein}g</p><p className="text-muted-foreground">{t("food.protein").toLowerCase()}</p></div>
            <div><p className="font-semibold">{food.per100.fat}g</p><p className="text-muted-foreground">{t("food.fat").toLowerCase()}</p></div>
          </div>
        </div>
      </div>

      <div className="border-t border-border p-3">
        <Button
          className="w-full rounded-full"
          disabled={n <= 0}
          onClick={() => onLog({ ...totals, food, servingCount: n, serving, mealType })}
        >
          <Plus className="size-4" /> {t("food.add_btn", { n: totals.kcal })}
        </Button>
      </div>
    </div>
  );
}

function CustomFoodForm({
  onBack, onSave,
}: {
  onBack: () => void;
  onSave: (food: Omit<FoodItem, "id" | "source">) => void;
}) {
  const { t } = useI18n();
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
        <button onClick={onBack} aria-label={t("food.back")}><ChevronLeft className="size-5" /></button>
        <h2 className="font-display text-sm font-semibold">{t("food.custom_title")}</h2>
        <div className="size-5" />
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        <Field label={t("food.f_name")} value={name} onChange={setName} placeholder={t("food.f_name_ph")} />
        <Field label={t("food.f_brand")} value={brand} onChange={setBrand} />
        <p className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("food.per100")}</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("food.f_cal")} value={kcal} onChange={setKcal} type="number" />
          <Field label={t("food.f_protein")} value={protein} onChange={setProtein} type="number" />
          <Field label={t("food.f_carbs")} value={carbs} onChange={setCarbs} type="number" />
          <Field label={t("food.f_fat")} value={fat} onChange={setFat} type="number" />
        </div>
        <Field label={t("food.f_serving")} value={servingG} onChange={setServingG} type="number" />
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
              { label: t("food.serving_default", { g: Number(servingG) || 100 }), grams: Number(servingG) || 100 },
              { label: t("food.serving_100"), grams: 100 },
              { label: t("food.serving_1"), grams: 1 },
            ],
          })}
        >
          {t("food.save")}
        </Button>
      </div>
    </div>
  );
}

function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
        active ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
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

async function downscaleToDataUrl(file: File, maxDim = 1024, quality = 0.85): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
