# Focus-selectie in template-editor aanpassen

## Doel
In de "Nieuwe training" / template-editor vervangen we het vrije-tekst Focus-veld door een klikbaar multi-selectie grid. De gebruiker hoeft niets te typen, kan "Full body" kiezen, en kan twee focusgebieden tegelijk aanklikken (opgeslagen als één label zoals "Benen + Bilspieren").

## Wat er verandert

1. **TemplateEditor (`src/components/template-editor.tsx`)**
   - Vervang `<Input value={focus} ... />` door een compact grid met klikbare pills.
   - Pills: Full body, Upper body, Lower body, Push, Pull, Legs, Glutes, Quads, Hamstrings, Calves, Chest, Back, Shoulders, Arms, Biceps, Triceps, Core, Abs, Cardio, Strength, HIIT, Mobility, Functional.
   - Maximaal 2 selecties tegelijk; bij een 3e klik verschijnt een korte toast "Kies maximaal 2 focusgebieden".
   - Geselecteerde waarden worden intern bijgehouden als `string[]` en opgeslagen in `WorkoutTemplate.focus` als samengevoegde string (`" + "` join), zodat bestaande code die `focus` als string verwacht blijft werken.
   - Bij openen van een bestaande template wordt een eventuele opgeslagen focus-string gesplitst op `" + "` (en fallback op komma/spatie) om de juiste pills als geselecteerd te tonen.

2. **Focus opties centraal definiëren**
   - Voeg een nieuw bestand `src/lib/focus-areas.ts` toe met de optielijst en helper `formatFocus(selected, t)`.
   - Deze lijst wordt hergebruikt in de TemplateEditor. De WorkoutWizard houdt zijn eigen kleinere set, maar we voegen daar ontbrekende basale opties (Full body, Upper body, Lower body, Push, Pull) aan toe zodat de AI-wizard ook dezelfde taal gebruikt.

3. **Vertalingen (`src/lib/i18n.tsx`)**
   - Voeg voor elke nieuwe focusoptie een key toe in alle 6 talen: `en`, `nl`, `ar`, `fr`, `de`, `es`.
   - Bestaande keys (`wiz.focus.Glutes`, `wiz.focus.Legs`, etc.) blijven bestaan; nieuwe keys volgen hetzelfde patroon: `wiz.focus.<OptionName>`.
   - Voorbeeld nieuwe keys: `wiz.focus.FullBody`, `wiz.focus.UpperBody`, `wiz.focus.LowerBody`, `wiz.focus.Push`, `wiz.focus.Pull`, `wiz.focus.Quads`, `wiz.focus.Hamstrings`, `wiz.focus.Calves`, `wiz.focus.Biceps`, `wiz.focus.Triceps`, `wiz.focus.Abs`, `wiz.focus.Cardio`, `wiz.focus.Strength`, `wiz.focus.HIIT`, `wiz.focus.Mobility`, `wiz.focus.Functional`.

4. **Weergave op andere plekken (`src/routes/_authenticated/fitness.tsx`)**
   - `nextWorkout.focus` en template-list items tonen de opgeslagen focus-string direct; geen aanpassing nodig omdat de waarde een leesbaar label blijft.
   - Wel zorgen dat te lange labels netjes afgekapt worden (`truncate`).

5. **Backwards compatibiliteit**
   - Opgeslagen templates met een enkel focuswoord (bijv. "Benen") blijven werken en worden bij openen correct getoond als één geselecteerde pill.
   - Templates zonder focus tonen geen geselecteerde pills.

## Wat er niet verandert
- De datastructuur `WorkoutTemplate.focus` blijft `string` (niet `string[]`), dus geen wijzigingen in opslag, API's of database.
- De layout en functionaliteit van de rest van de template-editor blijft hetzelfde.

## Testplan
- Open "Nieuwe training" in `/fitness`.
- Controleer dat het focus-veld een grid met klikbare pills toont.
- Klik 1 optie: label wordt zichtbaar als geselecteerd.
- Klik een 2e optie: beide zijn geselecteerd.
- Klik een 3e optie: toast verschijnt, derde optie wordt niet geselecteerd.
- Sla op en controleer dat het template in de lijst de focus toont als "Optie1 + Optie2".
- Open een oud template met enkele focus; controleer dat de juiste pill geselecteerd is.
- Wissel de app-taal en controleer dat de opties in dezelfde taal verschijnen.
