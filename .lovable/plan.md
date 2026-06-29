## Doel
Overal in de app een "geschiedenis" terug kunnen zien: gym workouts, activiteiten, gewicht/voortgang en eten. Voor eten zoals op de screenshot: door dagen heen bladeren en zien wat je toen at per maaltijd.

## Wat ik ga bouwen

### 1. Eten — dag-navigatie (zoals de screenshot)
- In `nutrition.tsx` boven aan de pagina een datum-strook: pijl ←, datum (vandaag / gisteren / weekdag + datum), pijl →.
- Maaltijdkaarten (ontbijt, lunch, diner, snacks) en totalen tonen automatisch de gekozen dag via `mealsOn(date)`.
- Vandaag-knop om snel terug te springen. Pijl → uitgeschakeld in de toekomst.
- Knop "Toevoegen" werkt alleen op vandaag; bij oudere dagen alleen lezen (geen per-ongeluk-toevoegen op de verkeerde dag). Kleine "Bekijk in geschiedenis"-stijl badge "Alleen lezen" als je niet op vandaag staat.

### 2. Gym workouts — geschiedenis
- Nieuwe route `/_authenticated/workout-history` met lijst van afgeronde sessies (datum, naam, duur, totaal volume, aantal sets, PR-badges).
- Bron: `workout_sessions` + `workout_sets` uit Lovable Cloud, gefilterd op `user_id`, gesorteerd op `ended_at` desc. Lokale `HISTORY_KEY` als fallback wanneer offline.
- Detail-sheet per sessie: alle oefeningen met sets/reps/kg en eventuele PR-badges.
- Ingang vanuit Fitness-scherm: kleine knop "Geschiedenis" naast de templates-lijst.

### 3. Activiteiten — geschiedenis
- Nieuwe route `/_authenticated/activity-history` met lijst afgeronde activiteiten (datum, naam, duur, pauze, evt. kcal/afstand wanneer later via HealthKit gevuld).
- Bron: `activity_sessions` uit Lovable Cloud, sortering desc.
- Detail-sheet per sessie met alle stats en notities.
- Ingang vanuit Activiteiten-sectie op dashboard: subtiele "Geschiedenis"-knop.

### 4. Voortgang — geschiedenis
- In `weight.tsx` onder de Gewichtstrend-kaart een "Alle metingen"-knop die een sheet/route opent met de complete lijst gewichten (datum, kg, verschil t.o.v. vorige).
- Zelfde patroon voor metingen (`measurements`) en foto's (`photos`) uit `progress.ts`: per blok een "Bekijk geschiedenis"-knop met chronologische lijst en delete/edit.

### 5. Gedeelde bouwstenen
- `src/components/history/DateStepper.tsx` — herbruikbare datum-strook (← datum →, Vandaag-knop, future-disable).
- `src/components/history/HistoryList.tsx` — generieke lijst met datum-grouping (Vandaag / Gisteren / deze week / per maand).
- i18n keys voor alle nieuwe strings in 6 talen (en, nl, ar, fr, de, es) toegevoegd in `src/lib/i18n.tsx`.

## Technische opmerkingen
- Eten blijft lokaal in `localStorage` (`vita.meals.v1`) — geen schema-wijziging nodig; `mealsOn(date)` bestaat al.
- Workouts/activiteiten: lezen uit Supabase met `requireSupabaseAuth`-server-functions (nieuw: `listWorkoutHistory`, `listActivityHistory`) zodat het ook na herinstall op een ander apparaat zichtbaar is. Fallback naar lokale history bij offline.
- Geen schema-migraties nodig; alle tabellen bestaan al met de juiste kolommen.

## Buiten scope
- Geen export/CSV (kan later).
- Geen edit van oude workout-sets (alleen weergave) — laat me weten als je dat ook wilt.
