
## 1. "Create workout" op homepage werkt niet
Op `src/routes/index.tsx` (Today's workout card) opent de knop nu een lokale dialog, maar maakt geen workout aan die zichtbaar is in Workouts. Aanpassen zodat de knop navigeert naar `/fitness` en daar direct de "New template" / wizard flow opent (via een `?action=new` query param die `fitness.tsx` afhandelt). Resultaat: één plek waar workouts beheerd worden.

Op de homepage blijft de Today's workout card alleen tonen wat er voor vandaag gepland staat (gekoppeld aan een template met `day = today`). Als er niks gepland is → "Geen workout vandaag" + knop "Plan voor vandaag" die ook naar `/fitness` linkt.

## 2. "Herbereken plan" in Settings doet niks
In `src/routes/_authenticated/settings.tsx` is de knop `set.recalc` niet gekoppeld. Implementeren: opnieuw doorlopen van onboarding-berekening (gewicht, lengte, leeftijd, doel, activiteit) → nieuwe kcal/macro doelen opslaan in user-profile + toast bevestiging. Knop linkt naar `/onboarding?recalc=1` zodat de bestaande wizard hergebruikt wordt en bij submit het profiel updatet i.p.v. opnieuw door te sturen naar home.

## 3. "Gratis" badge boven homepage → premium lock
Voorstel (mijn advies):
- Verwijder de "Free" pill bovenaan de homepage.
- Op premium-only features (AI Coach geavanceerde features, AI workout wizard, AI food scan/insight, Progress AI-analyse) een **slot-overlay** tonen voor free users: card blijft zichtbaar maar geblurred, met centraal een 🔒 icoon + "Premium" label + tap → naar `/pricing`.
- Een kleine "Upgrade" knop in de header (alleen voor free users), subtieler dan een "Free" label.

Component `<PremiumLock>` wrapper bouwen die kinderen blurt en de overlay rendert op basis van `useEntitlement()`.

## 4. Aura dagelijks advies ("Ik heb vandaag 8.000 stappen…")
**Plek:** nieuwe card bovenaan de homepage (boven Nutrition), getiteld "Aura's advies vandaag".

**Realisatie:**
- Server function `getAuraDailyInsight` (`src/lib/aura.functions.ts`) die de dag-gegevens verzamelt: stappen, vasten-uren, slaap (indien beschikbaar), kcal verbrand, kcal gegeten, gewicht.
- Roept Lovable AI Gateway aan (`google/gemini-3-flash-preview`) met structured output: `{ summary, kcal_advice, tip }`.
- Cache per gebruiker per dag (1 call/dag, opnieuw triggerbaar via refresh knop).
- Card toont samenvatting in spreektaal + aanbevolen kcal + tip.
- Premium-gated (zie punt 3) — free users zien blur + 🔒.

## 5. Nederlandse vertaling fitness
`src/routes/_authenticated/fitness.tsx` bevat hardcoded Engelse strings (bv. "Start the wizard", "My templates", "View all gym exercises with form", "Build your own or let the AI Coach help", "Sets, reps & rest included", "Progressive overload built in", "509 exercises", "New", "Monday · 1 ex · 3 sets"). Alle strings vervangen door `t("fit....")` keys en voor alle 6 talen (en, nl, ar, fr, de, es) vertalingen toevoegen in `src/lib/i18n.tsx`. Per core memory: i18n direct in alle 6 talen.

Tegelijk een pass over fitness gerelateerde keys controleren (workout dialog, exercise library, template editor) of er nog Engelse strings/halfvertalingen overblijven.

## 6. Food: AI chat FAB botst met "+" toevoegen
In `src/routes/_authenticated/nutrition.tsx` staan de groene AI-sparkle FAB en de "+" FAB boven elkaar rechtsonder, waardoor de + onder de chat verdwijnt.

Voorstel: één gecombineerde **SpeedDial FAB**:
- Eén groene ronde knop rechtsonder met "+".
- Tap → opent een mini-menu met 2 acties: "Maaltijd toevoegen" en "Vraag Aura" (sparkle).
- Lost meteen ook overlap op andere pagina's op waar dezelfde stack voorkomt (Home steps card, etc.) — zelfde component hergebruiken.

Alternatief: AI sparkle FAB verplaatsen naar linksonder. Mijn voorkeur: SpeedDial, schoner en consistent.

---

### Technische details
- Geen schemawijzigingen nodig behalve evt. tabel `aura_daily_insights (user_id, date, payload jsonb, created_at)` met RLS + grants voor caching.
- Nieuwe i18n keys: ~15 voor fitness, ~6 voor aura card, ~3 voor premium lock.
- Nieuwe componenten: `PremiumLock`, `SpeedDialFab`, `AuraInsightCard`.
- Nieuwe server fn: `getAuraDailyInsight` (Lovable AI, structured output via `Output.object` + Zod).
- Workout flow: `/fitness?action=new` en `/fitness?action=schedule` query handling in fitness route.

### Vragen voor je goedkeurt
- Akkoord met SpeedDial-aanpak voor Food FAB?
- Akkoord met blur+slot premium lock i.p.v. "Free" badge?
- Aura card bovenaan home (boven Nutrition) — of liever onderaan?
