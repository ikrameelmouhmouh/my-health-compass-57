# Workout sessie (Bevel-stijl) + redirect na toevoegen

## 1. Na "Workout toevoegen" → naar fitness
Na succesvol toevoegen in de chat-flow navigeert de app automatisch naar `/fitness` (na bevestiging Replace/Add), zodat je de nieuwe templates direct ziet. De chat-conversatie blijft bewaard in geschiedenis.

## 2. Workout starten (zoals foto 1)
Klik op een template-kaart in `/fitness` opent een bottom-sheet met:
- Titel + "X oefeningen, Y sets"
- Lijst van oefeningen (icoon, naam, "Machine · 3 sets")
- Knoppen: **Bewerk** (opent bestaande TemplateEditor) en **▶ Start**

## 3. Actieve workout-sessie (zoals foto 2)
Nieuwe route `/fitness/session/$templateId`:
- Lopende timer bovenaan (mm:ss, telt op vanaf start)
- Titel van workout + knop **Voltooi** (rood/oranje)
- Per oefening een kaart met:
  - Icoon, naam, "Machine · 3 sets", rust-timer-icoon, ⋯ menu
  - Rijen per set: setnummer, gewicht (kg, bewerkbaar), herhalingen (bewerkbaar), ▶ knop om set af te vinken
  - Afgevinkte set krijgt groene/gevulde stijl
  - "Voortgang" link + "+ Voeg set toe"
- Auto-rust-timer popup tussen sets (optioneel, standaard 60-90s, in te stellen per oefening via stopwatch-icoon)
- State wordt live opgeslagen in localStorage zodat je terug kunt komen als je per ongeluk wegnavigeert

## 4. Samenvatting na "Voltooi" (zoals foto 3)
Modal/route die toont:
- 🎉 Confetti-animatie + workoutnaam + tijdstempel
- **Totale duur** + **Actieve duur** (totaal minus rusttijd)
- **Totaal volume (kg)** = som van gewicht × herhalingen per set
- **Totaal aantal herhalingen**
- **Aantal sets voltooid**
- Geschat **Calorieën** (op basis van duur, gewicht-gebruiker, MET-waarde krachttraining ≈ 5)
- Per oefening: tabel met set, gewicht, herhalingen, (rusttijd indien gemeten)
- PR-detectie: vergelijk met laatste sessie van dezelfde oefening, toon 💪 "Nieuw record" badge
- Knoppen: **Gereed** (sluit, terug naar fitness), **Bekijk activiteit** (later: detailpagina), **Werk sjabloon bij** (overschrijft template-gewichten met deze sessie)

## 5. Geschiedenis
- Sessies opgeslagen in localStorage onder `fitness.sessions.v1`
- Op fitness-scherm onder "Afgelopen 30 dagen" een lijst met voltooide sessies (datum, naam, duur, volume) — klik = open samenvatting opnieuw

## Extra opties om te overwegen (laat mij weten welke je wilt)
- **A. Rusttimer met geluid/trilling** na elke set
- **B. Superset-koppeling** (zoals 🔗-icoon op foto 2 tussen oefeningen)
- **C. Hartslag/calorieën via Apple Health** — vereist native, voor nu schatting op basis van formule
- **D. "Vorige keer"-hint** onder elke set (bv. "vorige: 35kg × 12") zodat je weet wat je moet doen
- **E. Notities per oefening** (hoe voelde het, RPE 1-10)
- **F. Plate calculator** (welke schijven op de stang voor X kg)
- **G. Audio-cue / stem** voor "Set voltooid, rust 60s"
- **H. Persoonlijke records** apart bijgehouden per oefening met grafiekje
- **I. Workout pauzeren** zonder de timer kwijt te raken

## Technische opzet
- `src/lib/workout-session.ts` — types `WorkoutSession`, `SessionSet`, hooks `useActiveSession`, `useSessionHistory`; alles localStorage
- `src/components/workout/session-start-sheet.tsx` — bottom-sheet (foto 1)
- `src/routes/_authenticated/fitness.session.$templateId.tsx` — actieve sessie (foto 2)
- `src/components/workout/session-summary.tsx` — samenvattingsmodal (foto 3)
- Template-kaart in `fitness.tsx` opent de start-sheet i.p.v. direct de editor
- Chat-flow: na `applyTemplates` `navigate({ to: "/fitness" })`

Welke van de extra opties (A–I) wil je meenemen in de eerste versie? Standaard pak ik **A (rusttimer)**, **D (vorige keer)** en **H (PR's)** mee — die geven de meeste waarde zonder native APIs.
