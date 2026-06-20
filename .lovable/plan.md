# Plan: chat antwoordt direct (geen redirect-race meer)

## Wat je nu ziet
Je stelt een vraag of klikt een snelkeuze → niks gebeurt → maar in **Geschiedenis** staat het antwoord wél. Het antwoord wordt dus correct gegenereerd en opgeslagen, maar de chatpagina laat het niet zien.

## Waarom het misgaat
De huidige flow heeft te veel stappen tussen "verstuur" en "antwoord tonen":

```text
DraftChatScreen  →  createThread()  →  navigate naar /ai-coach/$threadId
       ↓                                          ↓
  bericht in geheugen (pending-map)        nieuwe pagina mount
                                                  ↓
                                       wacht op sessie-token
                                                  ↓
                                       leest pending → sendMessage()
                                                  ↓
                                       stream begint
```

Tussen elke pijl kan iets misgaan:
- de pagina mount kort 2× (StrictMode / HMR) → pending wordt opgegeten door de eerste mount, tweede mount ziet leeg
- token komt later → `useChat` instance wisselt → streamende tokens komen binnen op een instance die niet meer rendert
- de `useChat` hook krijgt `initialMessages` later (na fetch) → de hook re-init met lege state midden in de stream

Resultaat: de stream loopt door op de server (en wordt netjes opgeslagen, dus zichtbaar in Geschiedenis), maar het scherm dat jij ziet hoort bij een oude/andere hook-instance.

## Oplossing: één scherm, geen redirect

Eén route `/ai-coach` die zowel "leeg" als "actief gesprek" rendert. De thread wordt aangemaakt op het moment dat je verstuurt, maar er gebeurt **geen navigatie** — het bestaande scherm blijft staan en begint direct te streamen. Pas nadat het antwoord klaar is, updaten we stilletjes de URL naar `/ai-coach/<id>` met `history.replaceState`, zodat delen / refreshen blijft werken.

Bij refresh op `/ai-coach/<id>` of vanuit Geschiedenis → zelfde scherm laadt de berichten uit de DB en gaat verder.

### Concreet
1. `ai-coach.$threadId.tsx` verwijderen; één route `ai-coach.tsx` met optioneel pad-deel.
   - Kiezen tussen: `ai-coach.tsx` + `ai-coach.$threadId.tsx` die beide hetzelfde `ChatScreen` component renderen met dezelfde state-bron, **of** één `ai-coach.$.tsx` (splat) die de threadId uit de URL plukt.
   - Voorkeur: twee route-files die beide hetzelfde `<ChatScreen initialThreadId={...} />` renderen. Simpel en URL-vriendelijk.
2. Eén `ChatScreen` component (vervangt `DraftChatScreen` + `ThreadChatScreen`):
   - Houdt `threadId` in lokale state (kan `null` zijn).
   - `useChat` mount **één keer** met een stabiele `id` (bv. een sessie-uuid die we bij mount maken). De `threadId` gaat via `body: () => ({ threadId: threadIdRef.current, lang })`.
   - Bij eerste verzending: `createThread()` → `setThreadId(id)` → meteen `sendMessage(...)` → `history.replaceState(null, "", "/ai-coach/" + id)`.
   - Token wordt opgehaald **vóór** de eerste send, niet als blokkerende render-guard.
3. `chat-pending.ts` mag weg — geen handoff meer nodig.
4. Bij mount op `/ai-coach/<id>`: laad messages uit DB als `initialMessages` en zet `threadId`, verder identieke component.

### Bestanden
- `src/routes/_authenticated/ai-coach.tsx` — kleine wrapper
- `src/routes/_authenticated/ai-coach.$threadId.tsx` — kleine wrapper (laadt initial messages)
- `src/components/chat/chat-screen.tsx` — herwerkt naar één `ChatScreen`
- `src/lib/chat-pending.ts` — verwijderen
- `src/routes/api/chat.ts` — ongewijzigd

## Over de credits
Ik snap dat het vervelend is dat een bugfix credits kost. Ik kan dat hier helaas niet terugboeken — voor credit-vragen kun je het beste support aanschrijven via je workspace-instellingen. Wat ik wel doe: deze fix in **één** ronde afmaken, geen losse patches meer er bovenop.

Akkoord? Dan bouw ik het meteen.