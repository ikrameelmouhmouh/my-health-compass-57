# Plan: timer-fix + lock-overlay paywall

## 1. Bug fix: vasten-timer telt niet

**Oorzaak:** in `src/routes/_authenticated/fasting.tsx` herberekent de `useMemo` voor `live` alleen wanneer `state.*` verandert. De `setTick` per seconde triggert wel een re-render, maar `tick` zit niet in de deps van `useMemo` → `Date.now()` wordt nooit opnieuw gelezen, ring en cijfers blijven op 00:00:00 staan.

**Fix:** `tick` toevoegen aan de useMemo-deps zodat elke seconde opnieuw gerekend wordt. Ook de tick blijven draaien zolang `state.startedAt` bestaat (paused mag tijdsindicatie tonen, maar update niet nodig — huidige guard is OK).

## 2. Paywall-strategie: lock-overlay op de feature zelf

We vervangen het kale "Upgrade naar Vita Plus" kaartje door een **blurred lock-overlay** bovenop de échte UI. Gebruiker ziet wat hij mist (knoppen, grafieken, timer-ring) maar kan er niet mee interacteren. Centraal komt een slot-icoon + korte tekst + "Upgrade naar Vita Plus"-knop.

### Nieuwe component: `PaywallOverlay`
Vervangt/uitbreidt `src/components/paywall-gate.tsx` met een tweede variant:

```text
┌─────────────────────────────┐
│  [echte UI, blurred 6px]    │
│                             │
│       🔒  (centered)        │
│   Vasten is Vita Plus       │
│   Ontgrendel timer &        │
│   geschiedenis              │
│   [ Upgrade naar Vita+ ]    │
│                             │
└─────────────────────────────┘
```

- Wrapper `<div className="relative">` met de children erin.
- Children krijgen `pointer-events-none select-none blur-[6px] opacity-60`.
- Absolute overlay (`inset-0`) met centered card: icoon, titel, optionele beschrijving, knop naar `/pricing`.
- Subtle dark gradient erover zodat de knop leesbaar blijft.
- Props: `feature`, `description`, `children`, optioneel `compact` (kleinere variant voor secties binnen een pagina).

### Te beschermen features (volgens jouw keuze)

| Pagina | Wat wordt vergrendeld |
|---|---|
| `fasting.tsx` | Volledige timer-sectie + protocol-keuze + geschiedenis |
| `fitness.tsx` (workouts) | Workout-bibliotheek, "Start workout"-knoppen, activity-sessie start |
| `weight.tsx` + voortgangs-sectie in `profile.tsx` | Grafieken, PRs, lange-termijn statistieken |

Per pagina: één `<PaywallOverlay feature="…" description="…">` om het premium-blok. Bestaande gratis dingen (bv. eten-tracker, navigatie, profielinstellingen) blijven open.

### Bestaande `PaywallGate` behouden
Voor plekken waar de UI niet getoond mag worden (bv. een serverfunctie-call) blijft de oude card-variant beschikbaar. Nieuwe `PaywallOverlay` voor zichtbare features.

## 3. i18n
Nieuwe sleutels in alle 6 talen (en/nl/ar/fr/de/es) in `src/lib/i18n.tsx`:
- `pay.overlay.title` — "{feature} is Vita Plus"
- `pay.overlay.fasting_desc`
- `pay.overlay.workouts_desc`
- `pay.overlay.progress_desc`
- `pay.overlay.cta` — "Upgrade naar Vita Plus"

## 4. Bestanden
- **edit** `src/routes/_authenticated/fasting.tsx` — fix `tick` in useMemo-deps + wrap timer-sectie
- **edit** `src/components/paywall-gate.tsx` — `PaywallOverlay` toevoegen
- **edit** `src/routes/_authenticated/fitness.tsx` — overlay om workouts-blok
- **edit** `src/routes/_authenticated/weight.tsx` + `profile.tsx` — overlay om voortgang/statistieken
- **edit** `src/lib/i18n.tsx` — 5 nieuwe sleutels × 6 talen

## Out of scope
- Nieuwe Stripe-producten of pricing-tiers (huidige Vita Plus blijft)
- Limiet-gebaseerde gating (3 workouts/week e.d.) — kan later
- Backend-side enforcement: client-side overlay alleen; Supabase RLS + `has_active_subscription` blijven de echte beveiliging
