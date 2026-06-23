## Doel
Eten ook achter de paywall, en op de Start-pagina moeten de actieknoppen voor gratis gebruikers direct naar `/pricing` linken in plaats van hun actie uit te voeren.

## Wijzigingen

### 1. Eten-route achter sneak-peek paywall
- `src/routes/_authenticated/food.tsx` (of vergelijkbaar — eerst bevestigen welk routebestand de `/food` pagina rendert)
- Hoofdcontent wrappen in `<PaywallOverlay feature={t("food.title")} description={t("pay.overlay.food_desc")}>` — dezelfde sneak-peek behandeling als fitness/vasten/voortgang.

### 2. Start-pagina knoppen → pricing voor gratis gebruikers
In de Start/dashboard route (`src/routes/_authenticated/index.tsx` of het dashboard-bestand):
- `useSubscription()` ophalen.
- Voor de drie kaart-CTA's:
  - **Calorieën "+ Log"** → als niet-Pro: render als `<Link to="/pricing">` met dezelfde groene styling. Pro: huidige gedrag.
  - **"Vasten starten"** → als niet-Pro: `<Link to="/pricing">`. Pro: huidige startactie.
  - **Workout-kaart CTA** (onderaan zichtbaar) → zelfde patroon.
- Knoppen blijven visueel identiek (groen, actief uitziend) — alleen het doel verandert.

### 3. Vertalingen
Nieuwe key `pay.overlay.food_desc` toevoegen in alle 6 talen (en, nl, ar, fr, de, es) in `src/lib/i18n.tsx`.

## Buiten scope
- Geen wijziging aan de visuele styling van de Start-kaarten zelf.
- Geen backend-check (client-side paywall, server enforcement blijft zoals nu).
- Geen wijziging aan de PaywallOverlay-component.

## Te bevestigen tijdens build
- Exacte bestandsnaam van de Eten-route en van het Start-dashboard (ik check eerst `src/routes/_authenticated/` voordat ik wijzig).
