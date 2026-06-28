## Doel
1. Niet meer steeds opnieuw inloggen — sessie blijft bewaard tot je handmatig uitlogt.
2. App controleren op errors (TypeScript, console, runtime).

## Waarom je nu steeds moet inloggen
De Supabase client staat al op `persistSession: true` + `autoRefreshToken: true`, dus normaal blijf je ingelogd. In de Lovable preview gebeurt het toch vaak omdat:
- Elke preview-reload een nieuwe iframe-context maakt waarin `localStorage` soms leeg is.
- `_authenticated.tsx` doet bij `!session` direct een redirect naar `/login` of `/welcome` — ook tijdens de eerste milliseconden voordat Supabase de session uit storage heeft hersteld bij een trage start.
- Geen "remember me" fallback: als de refresh-token om wat voor reden faalt, val je terug op het loginscherm zonder retry.

## Wat ik ga doen

### 1. Sessie écht persistent maken
- In `src/integrations/supabase/client.ts` is `persistSession` al aan — laten staan. (Bestand is auto-generated, niet aanraken tenzij nodig.)
- In `src/lib/auth-context.tsx`: de `loading` state pas op `false` zetten nadat zowel `getSession()` als de eerste `onAuthStateChange` event binnen zijn, zodat we nooit te vroeg "geen sessie" concluderen.
- Een kleine grace-period (bv. 400ms) toevoegen in `_authenticated.tsx` voordat we redirecten, zodat Supabase tijd heeft om de token uit storage te lezen.
- Backup: bij succesvolle login het user-id ook in `localStorage` cachen onder `vita.last_user`. Bij volgende bezoek tonen we direct het app-shell skelet (geen redirect naar `/login`) totdat Supabase bevestigt of de session geldig is. Pas als Supabase expliciet zegt "geen geldige session" → naar login.

### 2. "Dev bypass" tijdens ontwikkeling (optioneel — alleen als jij dat wilt)
Een schakelaar in `.env.development` (`VITE_DEV_SKIP_AUTH=1`) waarmee `_authenticated.tsx` de auth-check overslaat en je direct in de app komt. Niet actief in productie. Laat me weten of je dit erbij wilt.

### 3. Handmatig uitloggen blijft de enige trigger voor opnieuw inloggen
- Sign-out via Instellingen → wist localStorage + Supabase session → redirect naar `/login`.
- Verder nooit forced logout (geen auto-expire redirect, tenzij refresh-token écht ongeldig is).

### 4. App-brede error scan
- TypeScript build check (`tsgo`).
- ESLint scan.
- Runtime check via Playwright: openen van Start, Fitness, Voeding, Vasten, Badges, AI Coach, Instellingen → console errors verzamelen en screenshots maken.
- Security linter draaien op de database.
- Resultaten samenvatten en eventuele kritieke fouten oplossen (kleine fixes meteen, grotere als losse vervolg-actie melden).

## Buiten scope
- Biometrisch/PIN unlock (kan ik later toevoegen als je dat wilt na herstellen van wachtwoordlogin).
- Volledige rewrite van auth flow.

## Vraag aan jou
Wil je de **dev bypass** (stap 2) erbij zodat je tijdens testen helemaal geen login meer ziet, of liever alleen stap 1 (sessie blijft hangen, eerste keer wel inloggen)?
