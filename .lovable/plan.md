
# Plan: AI Coach chat toevoegen

De groene "Chat met je coach — binnenkort" knop wordt een werkende AI-chat. Je kunt meerdere aparte gesprekken voeren met de coach, en alles wordt opgeslagen in je account zodat het op al je apparaten beschikbaar is.

## Wat je krijgt

- **Nieuw chatscherm** op `/ai-coach/:threadId` met een rustige iOS-stijl, passend bij de rest van de app.
- **Threadlijst** op `/ai-coach` met al je gesprekken (titel, laatste bericht, datum). Knop "Nieuw gesprek" bovenin.
- **Streaming antwoorden** van de coach (woorden verschijnen terwijl ze gegenereerd worden), met markdown-ondersteuning.
- **AI-coach persoonlijkheid**: kent je profiel (doel, gewicht, calorie-target, taal) en geeft daarop afgestemd advies over voeding, vasten en workouts.
- **6 talen** (en/nl/ar/fr/de/es) — de coach antwoordt in jouw ingestelde taal en de UI-strings worden direct vertaald.
- **Bottom nav + AiFab** blijven werken; de "binnenkort"-knop op het profielscherm linkt straks naar `/ai-coach`.

## Technisch (voor de volledigheid)

### Database (migratie)
- `chat_threads` (user_id, title, last_message_at) — RLS per user.
- `chat_messages` (thread_id, role: user/assistant, content, created_at) — RLS via thread-eigenaar.
- Beide met GRANTs voor `authenticated` + `service_role`.

### Backend
- Streaming chat: `src/routes/api/chat.ts` (TanStack server route) → Lovable AI Gateway met `google/gemini-3-flash-preview` via AI SDK (`streamText` + `toUIMessageStreamResponse`).
- Auth via bearer-token (Supabase user), thread-eigendom gevalideerd in de handler.
- `onFinish`: assistant-bericht opslaan in `chat_messages` voor die thread.
- Server functions (`src/lib/chat.functions.ts`) voor: `listThreads`, `createThread`, `getThreadMessages`, `deleteThread`, `renameThread` — allemaal achter `requireSupabaseAuth`.

### Frontend
- AI Elements installeren: `conversation`, `message`, `prompt-input`, `shimmer`.
- `src/routes/_authenticated/ai-coach.tsx` → threadlijst + "Nieuw gesprek" knop.
- `src/routes/_authenticated/ai-coach.$threadId.tsx` → chat-window met `useChat` (AI SDK), gekeyed op `threadId`.
- System prompt bevat profielcontext (taal, doel, dagelijkse cal-target).
- Foutmeldingen voor rate limit (429) en credits op (402).

### i18n
- Nieuwe keys (titel, placeholder, "Nieuw gesprek", "Verwijderen", lege-staat, error-toasts) toegevoegd voor alle 6 talen tegelijk.

## Wat blijft hetzelfde
- Bottom nav, profielpagina, AiFab — geen visuele wijzigingen.
- Geen veranderingen aan voeding/vasten/workouts.

## Kosten
- Elke chat-vraag gebruikt een paar Lovable AI credits (Gemini Flash is goedkoop). Je hebt nog ~176 credits.
