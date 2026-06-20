## Kort antwoord op je vraag

**Nee, je hoeft niets te wachten op Despia.** De AI-chat (Vita) draait via Lovable Cloud + Lovable AI en hoort **nu al** te werken in de webpreview én straks in de gepubliceerde app. Despia is alleen een "verpakking" rond je website om hem in de App Store / Play Store te zetten — het voegt geen functionaliteit toe. Als de chat niet werkt, is dat een bug in de huidige code, niet iets dat Despia oplost.

## Wat ik in je sessie zie

- Je typte op de chatpagina: *"Hoeveel calorieën zit er in karne…"* en klikte op verzenden.
- In het netwerklog zie ik wél dat er een nieuwe thread werd aangemaakt (`createThread` → 200 OK, thread `d35e68b9-…`).
- Ik zie **géén** vervolgrequest naar `/api/chat`. Dat betekent: na het aanmaken van de thread is je bericht nooit naar Vita verstuurd.
- Vervolgens navigeerde je weg naar `/fitness` en `/profile`, dus mogelijk heb je niet gezien dat de thread-pagina blanco bleef.

## Vermoedelijke oorzaak

De stroom is nu: `DraftChatScreen` → maakt thread → zet bericht in een in-memory Map (`chat-pending.ts`) → navigeert naar `/ai-coach/$threadId`. Op de threadpagina wordt het bericht pas verstuurd nadat de Supabase-sessietoken is opgehaald via een aparte `useEffect`.

Twee zwakke plekken die dit precies kunnen verklaren:
1. **Race condition**: als `takePendingMessage` één render eerder draait dan de token er is, valt de eerste effect-tak in de `if (!token) return;`-tak, maar **`sentPendingRef.current` blijft `false`**. Bij de volgende render mét token leest hij weer de Map — maar dat werkt alleen als de Map nog niet door iets anders is leeggemaakt. In ontwikkeling reloadt Vite-HMR de module soms, waardoor de Map leeg is en het bericht permanent verloren is.
2. **`sendMessage` race**: bij snel navigeren kan `useChat` met `id={threadId}` nog een vorige interne staat hebben en de `sendMessage`-aanroep negeren voor de eerste mount.

## Plan: chat betrouwbaar laten verzenden

### Stap 1 — Pending-bericht robuust maken
- `chat-pending.ts`: ook in `sessionStorage` opslaan (key: `chat:pending:<threadId>`) zodat een HMR-reload of korte navigatie het bericht niet kwijtmaakt.
- `takePendingMessage` leest eerst uit de Map, valt terug op `sessionStorage`, en wist beide bij succes.

### Stap 2 — Verzenden pas triggeren als alles klaar is
In `ThreadChatScreen`:
- `sentPendingRef.current = true` **pas zetten ná** een geslaagde `sendMessage`, niet bij de eerste render zonder token.
- Het effect afhankelijk maken van `token` én van een korte `useChat`-readiness-check (`status === "ready"`).
- Bij `sendMessage`-fout: toast tonen, bericht **terugzetten** in `sessionStorage` zodat een reload het opnieuw probeert.

### Stap 3 — Visuele feedback bij draft → thread overgang
- Tijdens `busy` op draftscherm een duidelijke "Vita wordt geopend…" tonen in plaats van alleen een spinner, zodat duidelijk is dat je niet weg moet klikken.
- Op de threadpagina, zolang `token === null`, niet stil laden maar "Verbinden met Vita…" tonen.

### Stap 4 — Eenvoudiger alternatief overwegen (aanbevolen)
De hele handoff via een aparte route + Map is fragiel. Cleaner:
- **Eén route `/ai-coach`** die zelf de thread aanmaakt op het moment van verzenden (geen redirect).
- Pas **na** de eerste assistant-respons (of in de URL via `router.navigate({ to: "/ai-coach/$threadId", replace: true })`) bookmark-bare URL bijwerken.
- Voordelen: geen pending-map, geen race met token, geen lege threads in de database als de gebruiker wegklikt.

Ik raad **Stap 4** aan als hoofdoplossing; Stap 1–3 zijn de minimaal-invasieve fallback als je het huidige routingmodel wil houden.

### Stap 5 — Verifiëren
- In de preview: typ een bericht → controleer in netwerk dat `POST /api/chat` 200 teruggeeft met een streamende body.
- Test ook: foto-chip → bericht moet `📷` opslaan en Vita moet antwoorden.
- Test: een snelle "Quick action"-chip op het draftscherm moet ook direct antwoord geven.

## Bestanden die ik ga aanpassen
- `src/components/chat/chat-screen.tsx` (Draft + Thread)
- `src/lib/chat-pending.ts` (alleen bij keuze Stap 1–3)
- Eventueel `src/routes/_authenticated/ai-coach.tsx` en `ai-coach.$threadId.tsx` (samenvoegen bij Stap 4)

Welke richting wil je: **Stap 4 (herontwerp, robuust)** of **Stap 1–3 (kleine patch op huidige opzet)**?
