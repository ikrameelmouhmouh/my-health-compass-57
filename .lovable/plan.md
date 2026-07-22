## Doel
1. Standaardwaarden aanpassen zodat jij niet meer hoeft te schakelen bij een verse install/browser.
2. De twee admin-schermen (`/admin/view-mode` en `/admin/app-mode`) samenvoegen tot één "Edit pagina".
3. `/admin/exercise-frames` hernoemen naar "Edit workout pagina".

## Wijzigingen

### 1. Defaults omdraaien
- **Weergavemodus**: standaard `premium` (nu: `free`). Alleen wanneer jij expliciet op "Gratis" klikt wordt dat opgeslagen in `localStorage`. Klanten zonder de key krijgen nog steeds hun echte abonnementsstatus — de default geldt alleen als er niks in `localStorage` staat, dus dit raakt echte gebruikers niet.
- **App-modus**: standaard `edit` (nu: `customer`). Alleen wanneer jij expliciet op "Klantweergave" klikt wordt dat opgeslagen. Klanten hebben de key niet en zien dus gewoon de volledige flow (taal → intro → welkom → login).

Bestanden: `src/hooks/use-app-mode.ts` en de view-mode hook — alleen de default omdraaien.

### 2. Samenvoegen tot één "Edit pagina"
- Nieuwe route: `/admin/edit` met titel **"Edit pagina"**, twee secties onder elkaar:
  - **App-modus** — toggle Edit ⇄ Klantweergave + korte uitleg
  - **Weergavemodus** — toggle Premium ⇄ Gratis + reset-knop
- Oude routes `/admin/view-mode` en `/admin/app-mode` worden verwijderd.
- i18n-keys hergebruikt; nieuwe titel-key "Edit pagina" toegevoegd voor alle 6 talen (en, nl, ar, fr, de, es).

### 3. Hernoemen `/admin/exercise-frames`
- Paginatitel en eventuele navigatielabels worden **"Edit workout pagina"**.
- Route-pad blijft `/admin/exercise-frames` (interne URL ongewijzigd om bookmarks/links niet te breken); alleen de zichtbare naam verandert.
- Titel-key toegevoegd voor alle 6 talen.

### 4. Admin-links bijwerken
- Bestaande links/knoppen die naar `/admin/view-mode` of `/admin/app-mode` verwijzen wijzen voortaan naar `/admin/edit`.

## Wat NIET verandert
- De klantflow (taalkeuze, intro, welkom, login) blijft exact hetzelfde voor iedereen zonder de admin-keys.
- Echte betaalde/gratis logica voor klanten wordt niet aangeraakt — dit is alleen de lokale dev-override.
- De functionaliteit van de exercise-frames pagina blijft identiek; alleen de naam wijzigt.
