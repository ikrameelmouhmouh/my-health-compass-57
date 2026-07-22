## Doel

Eén admin-pagina met een toggle **Edit-modus ↔ Klantweergave** (zelfde patroon als `/admin/view-mode`). In Edit-modus (standaard voor jou, tot je zelf wisselt) worden de pre-app schermen — welkomstscherm, intro/onboarding-carousel, taalkeuze — automatisch overgeslagen en land je direct in de app. Klanten zien nergens iets van dit alles.

## Waarom niet ook "login overslaan"

Supabase bewaart je sessie al persistent in localStorage. Zolang je één keer ingelogd bent en niet uitlogt, krijg je het inlogscherm niet meer te zien — óók niet in Edit-modus. Kortom: Edit-modus lost het "steeds intro/welcome zien" op; sessie-persistence lost het "steeds inloggen" op (dat werkt al). Als je écht een keer bent uitgelogd, moet je één keer inloggen — daar valt niet omheen zonder wachtwoord op te slaan (onveilig, ook op jouw apparaat).

## Nieuwe pagina `/admin/app-mode`

- Zelfde admin-guard als `/admin/view-mode` en `/admin/exercise-frames` (`user_roles.role === 'admin'`).
- Twee-knops toggle: **Edit-modus** / **Klantweergave**.
- "Reset naar klantweergave" knop.
- Uitleg: "Edit-modus slaat welkomstscherm, intro en taalkeuze over. Alleen zichtbaar op dit apparaat."

State in `localStorage` onder key `alyva.app_mode` = `"edit" | "customer" | null`. Default (geen key) = klantweergave, dus klanten zijn ongewijzigd. Een kleine helper `useAppMode()` (analoog aan `usePremium()`) leest de key en luistert op `storage`/custom-event.

## Redirect-gedrag in Edit-modus

Op deze routes: als `app_mode === "edit"`, direct `navigate({ replace: true })` naar `/profile` (de bestaande `_authenticated` gate stuurt je door naar `/login` als er toevallig geen sessie is, en anders naar de app):

- `src/routes/index.tsx` — het huidige "Your personal health plan starts here"-scherm
- `src/routes/welcome.tsx` — Welcome to Alyva + intro-carousel
- `src/routes/intro.tsx` — intro-slides
- Taalkeuze-scherm (onderdeel van intro/welcome flow)

De redirect gebeurt in een `useEffect` bovenaan de component. Klanten (geen key) zien alles zoals nu.

## Wat NIET verandert

- `/login` en `/register` blijven ongewijzigd (edit-modus stuurt je alleen om die schermen heen wanneer je al een sessie hebt).
- `_authenticated` route-gate blijft ongewijzigd.
- `usePremium` / `/admin/view-mode` blijven zoals ze zijn — losse toggle.
- Klant-flow: geen enkele wijziging, geen extra checks, geen extra UI.

## i18n

Nieuwe keys in alle 6 talen (`en`, `nl`, `ar`, `fr`, `de`, `es`):
`admin.appmode.title`, `.desc`, `.edit`, `.customer`, `.reset`, `.admin_only`, `.current`, `.explain`.
