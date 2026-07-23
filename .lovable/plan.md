## Probleem

De "Coach-notitie" op /fitness komt uit `plan.progressionNotes`, die door de AI wordt gegenereerd in `generateWorkoutPlan` (src/lib/workout.functions.ts). De prompt zegt niet in welke taal — Gemini kiest daardoor standaard Engels. De rest van het plan (namen van oefeningen, focus-labels, notes) heeft hetzelfde probleem, maar de coach-notitie valt visueel het meest op.

De UI-label ("Coach-notitie") is al vertaald in alle 6 talen — dat is niet het probleem.

## Fix

**1. `src/lib/workout.functions.ts`**
- Voeg optioneel `locale` toe aan `WizardInput` (`en` | `nl` | `ar` | `fr` | `de` | `es`).
- In de system prompt: expliciete instructie "Write ALL user-facing text (name, split, focus, progressionNotes, exercise notes, suggestedWeight descriptors) in {locale-naam}. Exercise names blijven in hun gangbare vorm (meestal Engels: 'Bench Press', 'Squat') zodat de exercise-library matching blijft werken."
- Dag-namen (`Monday`…`Sunday`) blijven Engels — die zijn een enum en worden apart vertaald in de UI.

**2. Call sites doorgeven van locale**
- `src/components/chat/workout-plan-chat-flow.tsx` — haal `locale` uit `useI18n()` en geef mee aan `generateWorkoutPlan`.
- Andere aanroepers van `generateWorkoutPlan` idem (check ripgrep).

**3. Bestaande plannen**
- Al opgeslagen plannen blijven in oude taal tot de gebruiker op "Plan opnieuw genereren of bijwerken" drukt. Geen migratie — dat is bewust (geen AI-calls verspillen op oude data).

## Scope-grenzen

- Alleen taal van AI-output. Geen wijziging aan UI, layout, of styling van de coach-notitie kaart.
- Geen wijziging aan exercise-namen matching / library.
- Punt 1 (favorieten in "Find page or enter path") slaan we over — die zoekbalk hoort bij de Lovable-editor, niet bij jouw app.

Daarna gaan we door met **Fase 2: Home screen redesign**.
