
# Alyva verbeter-plan (4 fases)

Je hebt alles aangevinkt, dus ik splits het in vier logische fases. Elke fase is een aparte turn — na fase 1 lever ik op, jij test, dan pakken we fase 2. Zo blijft het overzichtelijk en kan je bijsturen.

---

## Fase 1 — Bug hunt + fixes (start hier)

Ik scan de codebase gericht en repareer wat ik vind. Concrete checks:

- **RLS audit** op alle history-tabellen: `workout_sessions`, `workout_sets`, `activity_sessions`, `exercise_prs`, `chat_messages`, `chat_threads`, `notifications`, `push_subscriptions`, `user_badges`, `meal_plans`. Elke tabel: policies compleet? GRANT aanwezig?
- **Timezone bug hunt** — alle "vandaag" filters (dashboard workout van vandaag, nutrition dag-totaal, fasting dag). Nu waarschijnlijk UTC in plaats van user-timezone.
- **i18n gaten** — grep op hardcoded Nederlandse strings in nieuwe features (session summary, fasting phases, badges, meal planner, chat flow). Vertaal naar en/nl/ar/fr/de/es.
- **Dode routes / dubbele features** — check of `social.tsx` gebruikt wordt en of `meal-planner` overlapt met `nutrition`. Verwijder of merge.
- **Auth persistence check** — sessie zou nu moeten blijven; verifiëren.
- **Offline gedrag** — workout logs zonder internet niet verloren.
- **Onboarding-antwoorden → AI Coach context** — check of de coach de gebruiker écht kent.

Deliverable: lijst van gevonden issues + fixes toegepast + korte "wat ik niet aangeraakt heb en waarom".

---

## Fase 2 — Home screen redesign (meer karakter)

Aparte turn omdat dit een visuele beslissing van jou vraagt.

- Screenshot huidige home (dashboard in `profile.tsx`)
- 3 design-richtingen genereren met **jouw huidige tokens (forest green, iOS grouped bg, SF Pro)** als vaste basis — variatie zit in compositie/hiërarchie/karakter, niet in kleur
- Richtingen verkennen (voorbeelden waar ik aan denk):
  - **A "Vandaag-brief"** — één grote hero-zin bovenaan ("Goedemorgen David, je vast 14u en Push staat gepland"), daaronder één primaire actie, rest weggevouwen
  - **B "Recovery ring"** — Whoop/Ultrahuman-stijl grote centrale ring met dagscore (combinatie vasten + geplande workout + gewicht-trend), modules eronder als secundair
  - **C "Editorial stack"** — Instrument Serif display voor grote nummers, magazine-achtige verticale flow met veel witruimte
- Jij kiest 1 → ik implementeer exact die richting

Ik raak alleen de dashboard-sectie in `profile.tsx` aan. Geen module-schermen, geen navigation.

---

## Fase 3 — Weekly review + slimme streaks

- **Zondag review scherm** (nieuwe route `/weekly-review`)
  - Auto-samenvatting: workouts gedaan, vast-uren, gewicht-trend, calorie-consistency, PR's
  - AI Coach commentaar in 1 paragraaf (LLM call met week-data)
  - "Deel met buddy" knop (voorbereiding op sociale laag)
  - Push notificatie zondag 18:00 om ernaar te linken
- **Streak-logica herzien** (Gentler Streak model)
  - Rustdagen tellen niet als "gemist" — je definieert je goal (bv. 4x/week trainen) en de streak = weken waarin je goal gehaald is, niet dagen op rij
  - Toon zowel current streak als "consistency %" laatste 30 dagen
- **Rest day suggesties** in dashboard: als je 3 dagen achter elkaar getraind hebt, actief adviseren

---

## Fase 4 — UX polish

Kleinere verbeteringen door de hele app:

- **Onboarding korter** — van 6+ schermen naar 3 (goal → frequentie → klaar), rest optioneel achteraf
- **"Herhaal gisteren"** knop in nutrition (1-tap logging van dezelfde maaltijd)
- **Quick-add calories** zonder food-match (voor als je haast hebt)
- **Confetti + haptic** bij PR en workout-voltooiing
- **Session summary polish** — beter contrast tussen "wat je deed" en "wat je verbeterde"
- **Apple Health / Google Fit sync check** — bekijk of dit haalbaar is in PWA context, anders aanbevelen om later als native wrapper

---

## Wat NIET in dit plan zit (bewust)

- Progress fotos met encryptie → apart traject, groot
- Sociale feed → jij zei eerder "buddy light", pas na weekly review
- Native app wrapper (Capacitor) → niet nodig tenzij je Health-sync wil
- Betaalflow / Stripe live → al aanwezig, geen actie tenzij bugs opduiken in fase 1

---

**Voorstel: ik begin met fase 1 (bug hunt).** Dat is het meest concreet en levert direct waarde. Home redesign vraagt jouw visuele input dus doen we als losse turn erna. Akkoord?
