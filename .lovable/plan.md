## Doel
Bij de bestaande oefening-afbeeldingen (grijze mannequin, Alyva Motion Lab stijl) de getrainde spiergroepen fel rood inkleuren — zoals het Lyfta-voorbeeld — met dezelfde camerahoek, achtergrond en set-opbouw. Geen nieuwe stijl, alleen kleuraccent op de actieve spieren.

## Aanpak

**1. Spierdata meesturen naar de generator**

`src/routes/_authenticated/admin.exercise-frames.tsx` stuurt nu alleen `{ name, equipment }` per oefening. Uitbreiden met `primary` en `secondary` uit `EXERCISES` (die staan al in `exercise-library.ts` als `MuscleGroup[]`).

`src/routes/api/admin/generate-exercise-frames.ts`:
- `exerciseData` type uitbreiden met `primary?: string[]; secondary?: string[]`.
- Doorgeven aan `generateForExercise` → `buildDefaultPrompt`.

**2. Prompt aanpassen zodat spieren rood worden**

In `buildDefaultPrompt` een muscle-highlight blok toevoegen dat de modellen instrueert:
- Primaire spieren (bv. "Chest", "Quads"): fel warm rood, duidelijk verzadigd, alsof anatomische overlay.
- Secundaire spieren: zachter oranje-rood, lichter.
- Rest van de mannequin blijft matte medium-grey.
- Kleuring zichtbaar door de kleding heen (net als in Lyfta) — geen tattoo/print effect, geen tekstlabels.
- Zelfde rode gebieden in start- én eindframe (consistent tussen frames).

Alleen toepassen als `primary.length > 0`; anders valt de oefening terug op de huidige prompt.

**3. Bestaande frames**

Nieuwe kleuren komen alleen op nieuw-gegenereerde frames. Op de Edit workout pagina staat al de per-oefening "regenerate" en de bulk-generator, dus jij kan zelf per oefening opnieuw draaien wanneer je wil (geen automatische mass-regeneratie — dat zou credits kosten en je huidige goedgekeurde frames overschrijven).

## Buiten scope
- Geen apart "Target muscles" front/back body-diagram onderaan de oefeningkaart (zoals in het Lyfta-screenshot). Als je dat er ook bij wil, laat het weten — dat is een aparte feature met eigen SVG-assets per spiergroep.
- Geen wijziging aan de UI-layout van de oefeningen zelf.

## Technische details
- Bestanden: `src/routes/_authenticated/admin.exercise-frames.tsx` (payload uitbreiden), `src/routes/api/admin/generate-exercise-frames.ts` (type + prompt).
- Geen DB-migratie nodig.
- `MuscleGroup` waarden zoals "Chest", "Back", "Quads" gaan als klare tekst mee in de prompt; het beeldmodel begrijpt anatomische termen.