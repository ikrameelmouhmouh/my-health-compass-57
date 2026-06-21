# Eten-pagina: één FAB met speed-dial menu

Geen twee overlappende zwevende knoppen meer op `/nutrition`. We vervangen ze door één groene "+" FAB rechtsonder die een klein menu opent met drie acties.

## Wat verandert er voor de gebruiker

- Op `/nutrition` zie je rechtsonder **één** ronde groene + knop.
- Tik → het menu opent omhoog met drie pillen:
  1. **Maaltijd toevoegen** (gewoon de huidige meal-add flow)
  2. **Scan met camera** (huidige food-scan flow)
  3. **Vraag Aura** (opent AI coach)
- Tik buiten het menu, of op de FAB nogmaals → menu sluit.
- De kleine "+" cirkels per maaltijd-rij (Ontbijt / Lunch / Diner / Snack) blijven gewoon werken voor "voeg direct toe aan deze maaltijd".
- Op alle andere routes (Start, Workouts, etc.) blijft de globale AI-FAB onveranderd zichtbaar.

## Technische uitwerking

### 1. `src/components/ai-fab.tsx`
- Verberg de globale AI-FAB volledig wanneer `pathname.startsWith("/nutrition")` (return `null`). De eerdere hoogte-aanpassing vervalt.

### 2. `src/routes/_authenticated/nutrition.tsx`
- Bestaande "+" meal-toevoeg FAB vervangen door nieuw component `NutritionSpeedDial`.
- Dat component:
  - `open` state.
  - Gesloten: 56px ronde groene knop met `+` icoon (roteert 45° naar `×` als open).
  - Open: tonen 3 actieknoppen verticaal boven de FAB, elk een ronde icoon + label-pill links ernaast (sparkle / camera / utensils). Fade + translate-y animatie.
  - Achtergrond-scrim onder het menu zodat tap-outside sluit.
  - Acties roepen bestaande handlers aan: open meal-picker, open scan dialog, navigate naar `/ai-coach`.

### 3. i18n keys (6 talen)
Nieuwe keys in `src/lib/i18n.tsx`:
- `nut.fab.add_meal` "Maaltijd toevoegen"
- `nut.fab.scan` "Scan met camera"
- `nut.fab.ask_aura` "Vraag Aura"

## Bestanden die wijzigen
- `src/components/ai-fab.tsx` — verberg op /nutrition
- `src/routes/_authenticated/nutrition.tsx` — vervang FAB door speed-dial
- `src/components/nutrition-speed-dial.tsx` — **nieuw**
- `src/lib/i18n.tsx` — 3 nieuwe keys × 6 talen

## Buiten scope
- Geen wijzigingen aan de individuele "+" knoppen per maaltijd-rij.
- Geen aanpassing aan AI-coach flow zelf, alleen navigatie ernaartoe.
