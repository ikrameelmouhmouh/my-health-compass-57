
# Voeding upgrade + onboarding-slides

Op basis van de screenshots pak ik 3 features aan én bouw ik matching onboarding-slides. AH-integratie sla ik over (vereist Albert Heijn partnership/API-deal — kan later).

## Wat ik ga bouwen

### 1. Voeding-dashboard — micronutriënten toevoegen
Huidig scherm heeft al kcal-ring + eiwit/koolh./vet bars. Missend: micro's.

- Uitbreiden `src/lib/food.ts` met micro-velden op `FoodItem` en `MealEntry`: `vitaminC`, `vitaminD`, `kalium`, `ijzer`, `calcium` (mg / µg).
- OpenFoodFacts-parser (`fromOFFProduct`) mapt beschikbare nutriment-velden (`vitamin-c_100g`, `vitamin-d_100g`, `potassium_100g`, `iron_100g`, `calcium_100g`).
- AI-photoscan prompt (`food-ai.functions.ts`) uitbreiden zodat Gemini ook micro's schat.
- Nieuwe kaart `<MicroDetails>` op nutrition-pagina: "Voedingsdetails — Vandaag" met de 5 rijen, exact zoals screenshot 1.

### 2. AI foto-scan — beter positioneren
Bestaat al (`food-ai.functions.ts` + `food-log-dialog.tsx`). Alleen zichtbaarheid verbeteren:
- Prominente "Scan maaltijd" primaire actie op nutrition-pagina met camera-icoon en subtitel "AI herkent je bord".

### 3. Mealprepping — 7-daagse planner
Nieuw feature.

- Nieuwe route `src/routes/_authenticated/meal-planner.tsx`.
- Nieuwe tabel `meal_plans` (via migratie) met `id`, `user_id`, `day_index` (0-6), `meals jsonb` (array van `{name, kcal, protein, carbs, fat}`), timestamps, RLS owner-only + GRANTs.
- UI: kaart met Dag 1–7, elke dag toont totaal kcal + chevron → detail sheet waar je maaltijden toevoegt (naam + kcal/macro's, of "kopiëren van eerder gelogde maaltijd").
- Entry-point vanaf nutrition-pagina: knop "Mealprep planner".

### 4. Onboarding-slides
Nutrition + Photo-scan + Mealprep als 3 slides toevoegen aan bestaande `src/routes/intro.tsx` carrousel. Screenshots uit user-uploads dienen als visuele inspiratie, niet als embedded images — we bouwen native versies met echte app-componenten in mini-preview stijl.

### 5. i18n
Alle nieuwe strings toegevoegd in `src/lib/i18n.tsx` voor alle 6 talen (en, nl, ar, fr, de, es).

## Uit scope

- **Albert Heijn winkelwagen** — geen publieke AH API voor bestellen; vereist partnership. Ik kan wel een boodschappenlijst-export bouwen (kopieer/deel als tekst) als je dat later wilt.

## Bestanden

Nieuw:
- `src/routes/_authenticated/meal-planner.tsx`
- `src/components/nutrition/micro-details-card.tsx`
- `src/components/nutrition/meal-plan-day-sheet.tsx`
- migratie: `meal_plans` tabel

Gewijzigd:
- `src/lib/food.ts` (micro-velden)
- `src/lib/food-ai.functions.ts` (prompt met micro's)
- `src/routes/_authenticated/nutrition.tsx` (micro-kaart + planner-knop + prominentere scan-knop)
- `src/routes/intro.tsx` (3 nieuwe slides)
- `src/lib/i18n.tsx` (6 talen)

Zeg "ga door" en ik bouw het.
