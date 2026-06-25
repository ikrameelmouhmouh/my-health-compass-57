# Premium-toggle herzien

## Probleem
- `PaywallGate` en `PaywallOverlay` gebruiken `useSubscription()` (echte Stripe-status), niet de override uit `usePremium()`. Daarom blijft alles op "betaal" staan zelfs als je in Settings op "Forceer plus" drukt.
- De extra "Automatisch"-modus en de zwevende chip rechtsonder zijn ongewenst.
- AI Coach (chat) is nu ook in gratis bereikbaar.

## Wijzigingen

### 1. `src/components/paywall-gate.tsx`
- Vervang `useSubscription()` door `usePremium()` in zowel `PaywallGate` als `PaywallOverlay`.
- Gebruik `isPremium` (die respecteert override) i.p.v. `isPro`. Hiermee unlockt "Premium" écht alles: fasting, fitness, weight overlays en alle gates.

### 2. `src/hooks/use-premium.ts`
- Reduceer override-type naar `"premium" | "free" | null` (null = echte abonnementsstatus volgen).
- `isPremium` = `override === "premium"` ? true : `override === "free"` ? false : `realIsPremium`.
- Houd `localStorage`-key + event sync hetzelfde.

### 3. `src/routes/__root.tsx`
- Verwijder `<TestModeBadge />` en de import.

### 4. `src/components/test-mode-badge.tsx`
- Bestand verwijderen.

### 5. `src/routes/_authenticated/settings.tsx`
- Hernoem sectietitel naar "Weergavemodus" (gewoon Premium/Gratis, geen "test").
- Vervang 3-knops switch door 2-knops segmented control: **Premium** | **Gratis**. Actieve knop = huidige `isPremium` (premium = aan, gratis = uit).
- Klik op een knop zet `setOverride("premium")` of `setOverride("free")`.

### 6. AI Coach gating
- In `src/routes/_authenticated/ai-coach.tsx` (en `ai-coach.$threadId.tsx`): als `!isPremium` toon `PaywallGate` met label "AI Coach" i.p.v. de chat. Premium = volledige toegang.

### 7. `src/lib/i18n.tsx`
- Verwijder keys: `set.testmode.auto`, `set.testmode.force_plus`, `set.testmode.force_free`, `testmode.badge.*`.
- Voeg toe (6 talen): `set.viewmode.title` ("Weergavemodus"), `set.viewmode.desc` ("Bekijk de app als Premium- of gratis gebruiker."), `set.viewmode.premium` ("Premium"), `set.viewmode.free` ("Gratis"), `pay.feature.ai_coach` ("AI Coach").

## Technische details
- Override-defaultwaarde verandert niet voor bestaande users: oude `"on"`/`"off"` waarden in localStorage worden bij lezen gemapt naar `"premium"`/`"free"` (backwards compat in `readOverride`); oude `"auto"` wordt `null`.
- Geen wijzigingen in DB, RLS of server-functions. Alleen frontend.
- `useSubscription` blijft bestaan voor `pricing.tsx` (echte Stripe-status tonen).
