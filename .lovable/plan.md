## Doel
De gekozen richting **"Refined iOS — vital green"** doortrekken in de hele app. iOS 18-structuur blijft staan; alleen tokens, radii en het actieve tab-state veranderen.

## Wat verandert er visueel
- **Accent / brand**: van zachte sage `#7d9b76` → diepere forest green `#2d5a27`. Wordt gebruikt voor primaire knoppen, geselecteerde state, actieve tab, brand-dot.
- **Card radius**: van `rounded-3xl` (24px) → **14px** (`rounded-[14px]`). Strakker, native iOS 18.
- **Card border**: hairline border vervangen door zachte `shadow-sm` op witte cards (zoals in het prototype). Geselecteerde card krijgt `ring-2` in brand-kleur i.p.v. checkmark-alleen.
- **Titels**: large title 34px **extrabold** (was bold), iets strakker tracking.
- **Subtitels**: 17px `text-muted-foreground` (slate-500-achtig), zonder uppercase.
- **Primaire knop**: 14px radius, forest green, subtiele gekleurde shadow (`shadow-brand/20`).
- **Tab bar**: blijft frosted, krijgt een **kleine punt-indicator** (1×1 dot) onder het actieve item + brand-kleur tint op icoon/label.
- **Achtergrond**: `#f2f2f7` (ongewijzigd, past al).
- **Dark mode**: dezelfde upgrades, accent licht iets op naar `#4a8042` voor leesbaarheid op `#000`.

## Technische wijzigingen
1. `src/styles.css`
   - `--brand` → `oklch`-equivalent van `#2d5a27` (light) en `#4a8042` (dark).
   - `--radius` van 14px bevestigen; component-rondingen op `rounded-[14px]` / `rounded-2xl` voor secties.
   - Bestaande `ios-chrome` / `ios-press` utilities ongewijzigd.
2. `src/components/bottom-nav.tsx`
   - Actieve item: brand-kleur icoon/label + 3px dot onder label.
   - Inactive: huidige muted style.
3. `src/components/module-page.tsx`
   - Title `font-extrabold`, card wrapper `rounded-[14px]`.
4. Card-componenten die nog `rounded-3xl` of `rounded-2xl` op content-cards gebruiken → `rounded-[14px]`. Sectie-containers blijven `rounded-2xl`.
5. Geen wijzigingen aan business logic, data, routes of i18n.

## Scope
Visuele tokens en presentatielaag — geen feature-, data- of backend-werk.

## Verificatie
- Build draait automatisch.
- Daarna preview-screenshot van Start, AI Coach, Profile en Language-screen om te checken dat brand-kleur, radii en tab-indicator overal kloppen.
