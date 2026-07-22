## Doel
De "Weergavemodus" (Premium / Gratis toggle) mag niet meer zichtbaar zijn voor gebruikers in `/settings`. Alleen jij, als admin, moet hem kunnen gebruiken via een aparte pagina `/admin/view-mode` — beveiligd op dezelfde manier als `/admin/exercise-frames`.

## Wijzigingen

### 1. `src/routes/_authenticated/settings.tsx`
- Verwijder de complete "View mode" sectie (regels ~99–133).
- Verwijder de niet meer gebruikte `setOverride` uit de `usePremium()` destructuring (behoud `isPremium` — die wordt nog gebruikt in de plan-card).

### 2. Nieuwe pagina: `src/routes/_authenticated/admin.view-mode.tsx`
- Zelfde admin-role-check als `admin.exercise-frames.tsx` (via `has_role` / `user_roles` met `app_role = 'admin'`). Niet-admins zien een "Geen toegang" bericht.
- Toont dezelfde Premium / Gratis toggle als nu in settings staat, gebruikmakend van `usePremium()` → `override` en `setOverride`.
- Extra: een derde knop "Reset" die `setOverride(null)` aanroept zodat je terug kan naar de echte subscription-status.
- Kleine uitleg-tekst: "Dit is een admin-tool. Gebruikers zien deze pagina niet."

### 3. Vertalingen (`src/lib/i18n.tsx`)
- Verwijder de nu ongebruikte `set.viewmode.*` keys niet (kunnen hergebruikt worden in nieuwe pagina), of hernoem naar `admin.viewmode.*`.
- Nieuwe keys voor alle 6 talen (en, nl, ar, fr, de, es):
  - `admin.viewmode.title` — "Weergavemodus"
  - `admin.viewmode.desc` — "Bekijk de app als Premium- of gratis gebruiker."
  - `admin.viewmode.premium` — "Premium"
  - `admin.viewmode.free` — "Gratis"
  - `admin.viewmode.reset` — "Reset naar echte status"
  - `admin.viewmode.admin_only` — "Alleen zichtbaar voor admins."
  - `admin.viewmode.no_access` — "Geen toegang."

## Technische details
- Route bestand: `src/routes/_authenticated/admin.view-mode.tsx` → URL `/admin/view-mode`.
- Admin check patroon (kopie uit `admin.exercise-frames.tsx`): query op `user_roles` waar `user_id = auth.uid()` en `role = 'admin'`; render pagina alleen als match.
- Geen wijzigingen aan `use-premium.ts` — API blijft `{ isPremium, override, setOverride, ... }`.
- Geen navigatie-link toegevoegd in menu's (pagina blijft "verborgen", alleen bereikbaar via URL door admin).

## Wat er NIET verandert
- De `usePremium()` hook, localStorage-mechanisme en de sneak-peek `PaywallOverlay` blijven ongewijzigd.
- Gewone gebruikers zien niets nieuws; voor hen verdwijnt alleen de sectie in settings.