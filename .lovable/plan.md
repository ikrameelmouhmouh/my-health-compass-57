## Doel
Bij het afkeuren van een oefening (rood kruisje in "Edit workout pagina") optioneel een korte uitleg kunnen geven. Die uitleg wordt bewaard en meegestuurd naar de AI bij de volgende regeneratie, zodat het model weet wat er anders moet (bijv. "frame 1 heeft geen ondergoed aan").

## Gedrag
- Klik op ✕ (markeer als slecht) → kleine dialog opent met:
  - Textarea "Wat is er mis? (optioneel)"
  - Voorbeeldtekst: bv. "Frame 1 mist ondergoed, mannequin ziet er niet neutraal uit…"
  - Knoppen: **Overslaan** (markeer slecht zonder feedback, huidig gedrag) en **Opslaan & markeer slecht**.
- Feedback wordt in de DB opgeslagen op de job.
- Bij "Genereer opnieuw" (⟳) op een oefening met opgeslagen feedback:
  - De feedback wordt als extra **CORRECTIONS** blok bovenaan de prompt toegevoegd voor zowel frame 0 als frame 1.
  - Zichtbaar in de UI: klein label onder de oefeningnaam "Feedback: ⟨eerste 60 tekens⟩ ✕" met een ✕ om te wissen.
- Na een succesvolle regeneratie blijft de feedback bewaard (voor volgende iteratie); wissen kan handmatig via het ✕.

## Technische wijzigingen

**1. Database migratie**
- Voeg kolom `feedback text null` toe aan `public.exercise_frame_jobs`.
- (kolom `prompt` blijft; is voor systeemprompt.)

**2. `src/routes/api/admin/generate-exercise-frames.ts`**
- Lees `feedback` uit de job bij `generateForExercise`.
- Als aanwezig, voeg vooraan `startPrompt` en `endPrompt` een blok toe:
  ```
  USER CORRECTIONS (highest priority, must fix in this render):
  <feedback tekst>
  ```
- Reset-actie wist ook `feedback` (naar `null`).

**3. `src/routes/_authenticated/admin.exercise-frames.tsx`**
- `JobRow` uitbreiden met `feedback: string | null`.
- Nieuwe kleine `FeedbackDialog` component (shadcn `Dialog` + `Textarea`).
- ✕-knop opent dialog i.p.v. direct upsert; dialog schrijft `{ status: "bad", feedback }` (of `feedback: null` bij overslaan).
- Toon feedback-badge onder de oefeningnaam met wis-knop (upsert `feedback: null`).
- Kleine i18n-keys in alle 6 talen (`admin.frames.feedback.*`): title, placeholder, skip, save_and_mark, saved_badge, clear.

## Uit scope (nu)
- Geen historisch feedback-log (alleen laatste feedback).
- Geen aparte feedback per frame (0 vs 1) — één veld voor de hele oefening; gebruiker kan zelf "frame 1: …, frame 2: …" schrijven.

## Herinnering
Hierna gaan we door naar **Fase 2: home screen redesign**.