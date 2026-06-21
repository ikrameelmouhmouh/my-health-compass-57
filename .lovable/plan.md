# AI Workout → Auto-template schema

De huidige "AI workout" wizard genereert al een weekplan via Lovable AI, maar slaat het alleen op als losse plan-state. We breiden de wizard uit met een dag-keuze, koppelen het resultaat aan templates per trainingsdag en gaten Vita Plus.

## Wat verandert er voor de gebruiker

1. Op `/fitness` → "AI workout" stelt de wizard nu deze vragen:
   - Doel (bestaand)
   - Ervaring (bestaand)
   - Locatie + apparatuur (bestaand)
   - **Hoeveel dagen per week** (bestaand)
   - **NIEUW: welke dagen van de week** (kies precies N dagen, matched met frequentie)
   - Focus-spiergroepen (bestaand)
   - Duur + blessures/voorkeuren (bestaand)

2. Na "Genereer schema":
   - Het weekplan wordt opgeslagen zoals nu (zichtbaar in fitness-dashboard met dagoverzicht).
   - **NIEUW:** Een dialog vraagt: *"Bestaande templates vervangen of toevoegen?"* (Vervang / Toevoegen / Annuleer).
   - Per gekozen trainingsdag wordt automatisch een **WorkoutTemplate** aangemaakt met naam `{focus} — {dag}` (bv. "Push — Maandag"), met de oefeningen uit het AI-plan. Deze verschijnen direct onder "Mijn templates" op /fitness.
   - Workouts die op een trainingsdag vallen, verschijnen al via het bestaande plan-systeem op de homepage "vandaag" en in het fitness-dashboard.

3. **Premium-gate:** AI workout knop is alleen toegankelijk voor Vita Plus. Free users zien een slot + upgrade-CTA naar `/pricing` (consistent met andere premium-features die we eerder hebben afgesproken).

## Technische uitwerking

### 1. `src/lib/workout.functions.ts`
- Voeg `trainingDays: z.array(z.enum(["Monday",...,"Sunday"])).optional()` toe aan `WizardInput`.
- In de system/user-prompt: instrueer model om non-rest dagen exact op deze dagen te plaatsen en andere op `rest:true, exercises:[]`.

### 2. `src/components/workout-wizard.tsx`
- `totalSteps` 7 → 8. Nieuwe stap 6 = dag-selectie (verschuif huidige focus naar 7, extras naar 8).
- State `trainingDays: string[]`; toon 7 pills (ma-zo), beperk selectie tot `frequency` (extra disable + helper-text).
- `canNext` voor nieuwe stap: `trainingDays.length === frequency`.
- Geef `trainingDays` mee in `generate({data})`.

### 3. `src/lib/workout-prefs.ts`
- Geen schemawijziging nodig. We hergebruiken `useTemplates().upsert` + `newTemplate`.
- Helper toevoegen: `templatesFromPlan(plan): WorkoutTemplate[]` die per non-rest `WorkoutDay` een template aanmaakt (naam `${focus} — ${dayLocalized}`, `day`, `focus`, `exercises`).

### 4. `src/routes/_authenticated/fitness.tsx`
- In `onComplete` van `WorkoutWizard`:
  1. `save(w, p)` zoals nu.
  2. Open `TemplateSyncDialog` (nieuw, klein): "Vervang bestaande templates" / "Voeg toe" / "Niet nu".
  3. Vervang → `templates.forEach(remove)` dan upsert nieuwe. Toevoegen → upsert nieuwe naast bestaande.
- Sluit wizard.

### 5. Premium gate
- Importeer bestaande `useEntitlement()` (zelfde als gebruikt voor AI Coach).
- Wrap "AI workout starten" knop in `EmptyState` en de "Herbereken" knop in dashboard: bij free user → toon `<PremiumLock>` overlay met `<Link to="/pricing">`.

### 6. i18n
Nieuwe keys in `src/lib/i18n.tsx` (6 talen: en, nl, ar, fr, de, es):
- `wiz.q5b.title` "Welke dagen wil je trainen?"
- `wiz.q5b.sub` "Kies precies {n} dagen"
- `wiz.q5b.day.Monday` … `Sunday`
- `wiz.q5b.pick_n` "Nog {n} te kiezen"
- `wiz.sync.title` "Wat doen we met je bestaande templates?"
- `wiz.sync.replace` / `wiz.sync.add` / `wiz.sync.skip`
- `wiz.sync.done_replace` / `wiz.sync.done_add` (toast)
- `wiz.premium.locked` "AI workout is onderdeel van Vita Plus"
- `wiz.premium.upgrade` "Upgrade"

## Bestanden die wijzigen
- `src/lib/workout.functions.ts` — schema + prompt
- `src/components/workout-wizard.tsx` — dag-stap + state
- `src/lib/workout-prefs.ts` — `templatesFromPlan` helper
- `src/routes/_authenticated/fitness.tsx` — onComplete dialog + premium gate
- `src/components/template-sync-dialog.tsx` — **nieuw**, kleine modal
- `src/lib/i18n.tsx` — nieuwe keys × 6 talen

## Buiten scope (in deze stap niet)
- Geen migratie naar Supabase (templates blijven localStorage zoals nu).
- Geen kalender-koppeling met agenda; "vandaag"-detectie loopt via bestaande plan.days[].day matching.
