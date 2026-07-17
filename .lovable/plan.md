## Doel
In het dag-scherm van de maaltijdplanner een zoekbalk toevoegen waarmee je eten kan opzoeken uit de voedselbank (OpenFoodFacts, zelfde bron als bij Voeding). Klik je op een resultaat, dan wordt de maaltijd met naam + kcal + macros automatisch toegevoegd aan die dag.

## Wijzigingen

**`src/routes/_authenticated/meal-planner.tsx` — DaySheet uitbreiden**
- Bovenaan het "Maaltijd toevoegen"-blok een zoekveld met debounce (300ms) dat `searchFoods(query)` uit `@/lib/food.ts` aanroept.
- Onder het zoekveld een lijst met resultaten (naam, merk, kcal/100g). Klik op een resultaat → maaltijd toegevoegd via bestaande `setMeals` logica (kcal/protein/carbs/fat uit `FoodItem.per100g`, afgerond op 100 g portie; standaard 1 portie, maar met een klein +/− stapper of hoeveelheidsveld in gram zodat de macros meeschalen).
- Handmatige invoer (naam + kcal/macros) blijft eronder staan als fallback.
- Laad/leeg-states + `AbortSignal` om oude requests te annuleren.

**`src/lib/i18n.tsx`**
- Nieuwe keys voor alle 6 talen: `mealplan.search_placeholder`, `mealplan.search_empty`, `mealplan.search_hint`, `mealplan.portion_g`.

## Buiten scope
- Geen wijziging aan `PlannedMeal` shape of de meal_plans tabel — bestaande velden (name, kcal, protein, carbs, fat) volstaan.
- Geen barcode-scan hier (die zit al in Voeding).
