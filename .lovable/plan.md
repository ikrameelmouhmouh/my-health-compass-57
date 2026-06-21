## 1. Featured workouts op Workouts-tab

In `src/routes/_authenticated/fitness.tsx` (regel 388) `EXERCISES.slice(0, 6)` vervangen door een vaste, gecureerde lijst op basis van ID's, in deze volgorde:

1. `barbell-squat` (Squat)
2. `barbell-bench-press` (Bench Press)
3. `deadlift` (Deadlift)
4. `lat-pulldown` (Lat Pulldown)
5. `wide-leg-press` (Leg Press)
6. `overhead-press` (Shoulder Press)

De overige featured oefeningen (Romanian Deadlift, Leg Extension, Lying Leg Curl, Barbell Hip Thrust, Calf Raise, Incline DB Press, …) blijven gewoon vindbaar in de volledige bibliotheek via de "All / 509 exercises"-knop. Er wordt niets uit `EXERCISES` verwijderd, alleen de preview-selectie verandert.

> Let op: in de screenshot staat "Leg Press" als #5. In de huidige featured-set bestaat geen kale "Leg Press" met 3D-frames; `wide-leg-press` is de meest passende leg-press variant met afbeeldingen. Als je liever een echte "Leg Press" tegel wilt, kan ik daar een nieuw featured-item met frames voor laten genereren — geef dat dan even aan.

## 2. Inlogscherm alleen na expliciet uitloggen

Gewenste flow:
- Eerste keer: taal → intro → welcome → register/login (zoals nu).
- Na succesvol inloggen/registreren: app onthoudt dit en opent voortaan **direct het Home-scherm** (`/profile`, dat is de Home-tab in de bottom nav).
- Sessie blijft bewaard (Supabase doet dat al via localStorage), dus er hoeft niets opnieuw ingevoerd te worden.
- Alleen wanneer de gebruiker in **Instellingen → Uitloggen** drukt, komt het email/wachtwoord-scherm terug.

Implementatie:
- Nieuwe localStorage-vlag `vita.has_account` wordt gezet bij geslaagde `signInWithPassword` / `signUp` in `src/routes/login.tsx` en `src/routes/register.tsx`.
- `src/routes/index.tsx`: als er een actieve Supabase-sessie is → direct naar `/profile`. Anders huidige logica (taalkeuze / intro / welcome).
- `src/routes/welcome.tsx`: bij mount checken of er een sessie is → redirect naar `/profile`.
- `src/routes/_authenticated.tsx`: als er geen sessie is, redirect naar `/login` alleen wanneer `vita.has_account` gezet is (sessie verlopen of expliciet uitgelogd). Anders naar `/welcome` (nieuwe gebruiker die per ongeluk een protected URL opent).
- Sign-out in Instellingen (`src/routes/_authenticated/settings.tsx`): bij uitloggen `vita.has_account` behouden (zodat we naar `/login` gaan, niet `/welcome`) en navigeren naar `/login`. Na succesvolle `signOut()` direct `navigate({ to: "/login", replace: true })`.
- Na login/register navigeren naar `/profile` in plaats van blijven hangen op auth-pagina (login doet dit al, register checken).

Resultaat: de allereerste keer zien gebruikers eenmalig het inlogscherm; daarna opent de app altijd op het Home-scherm tot ze expliciet uitloggen via Instellingen.

## Bestanden die gewijzigd worden

- `src/routes/_authenticated/fitness.tsx` — featured selectie
- `src/routes/index.tsx` — session-check + redirect naar `/profile`
- `src/routes/welcome.tsx` — session-check + redirect naar `/profile`
- `src/routes/_authenticated.tsx` — redirect-doel afhankelijk van `vita.has_account`
- `src/routes/login.tsx` — `vita.has_account` flag zetten
- `src/routes/register.tsx` — `vita.has_account` flag zetten + navigate
- `src/routes/_authenticated/settings.tsx` — sign-out flow naar `/login`
