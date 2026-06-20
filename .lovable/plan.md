# AI Coach: directe chat met snelacties

## Wat verandert er

Nu: je tikt op AI Coach → ziet eerst een lijst met gesprekken → moet "Nieuw gesprek" maken → komt pas dan in de chat. Te omslachtig.

Nieuw (zoals ChatGPT/Bevel): je tikt op AI Coach → komt direct in een chat-scherm met Vita-avatar, welkomstregel, **snelactie-chips** en de typebalk. Oude gesprekken blijven bewaard, maar zitten achter een menu-knop (☰) linksboven — niet meer als verplichte tussenstap.

## Nieuwe layout van `/ai-coach`

```text
┌───────────────────────────────┐
│ ☰  Vita            ✎ nieuw   │  ← header met geschiedenis-drawer + nieuw-chat
│                               │
│        (Vita avatar)          │  ← alleen als chat leeg is
│      Goed je te zien, {naam}  │
│                               │
│                               │
│  [📷 Scan maaltijd]           │  ← horizontaal scrollbare chips
│  [🏋️ Maak workoutplan]        │
│  [🥗 Maaltijdideeën]          │
│  [⚡ Snelle tip]              │
│  [📊 Analyseer m'n week]      │
│                               │
│  ┌─────────────────────────┐  │
│  │ Vraag Vita iets…    ➤ │  │  ← typebalk altijd zichtbaar
│  └─────────────────────────┘  │
└───────────────────────────────┘
```

Zodra je iets stuurt (chip of getypt) → chips en welkomstblok verdwijnen, gesprek begint te streamen op dezelfde pagina, en wordt automatisch opgeslagen als nieuwe thread.

## Snelactie-chips (eerste set)

Elke chip stuurt een vooraf-gevormde prompt naar Vita. Geen aparte schermen.

1. **📷 Scan maaltijd** → opent fotokiezer; foto wordt als bericht meegestuurd met prompt "Schat calorieën en macro's van deze maaltijd."
2. **🏋️ Maak workoutplan** → "Maak een workoutplan voor mij voor deze week, passend bij m'n profiel."
3. **🥗 Maaltijdideeën** → "Geef 3 maaltijdideeën die binnen m'n dagelijkse calorie- en macrodoel passen."
4. **⚡ Snelle tip** → "Geef me 1 concrete tip voor vandaag, gebaseerd op m'n doel."
5. **📊 Analyseer m'n week** → "Hoe gaat het deze week met m'n voortgang? Wat valt op?"

Tekst is per chip 1 woord + emoji; chips horizontaal scrollbaar zodat we er later makkelijk bij kunnen.

## Geschiedenis-drawer

Links-boven hamburger-icoon → side drawer met lijst van eerdere gesprekken (huidige threads-lijst, hergebruikt). Tikken laadt die thread in dezelfde chat-view. "Nieuw gesprek" knop bovenin de drawer en als pen-icoon rechtsboven in de header.

## Foto-upload (scan maaltijd)

- Verborgen `<input type="file" accept="image/*" capture="environment">` voor camera/galerij.
- Foto wordt geüpload naar bestaande Supabase storage (of als data-URL meegestuurd voor de eerste versie als er nog geen bucket is — dan voeg ik een `chat-images` bucket toe met RLS per user).
- Bericht naar Vita bevat de afbeelding (Gemini 3 Flash is multimodal — afbeeldingen worden ondersteund).

## Technische wijzigingen

- `src/routes/_authenticated/ai-coach.tsx` → wordt de chat-pagina zelf (niet meer threadlijst).
- `src/routes/_authenticated/ai-coach.$threadId.tsx` → blijft, voor het openen van een specifieke oude thread vanuit de drawer.
- Bij landen op `/ai-coach` zonder threadId: lokaal "draft" thread tot eerste bericht — pas dan wordt er een thread aangemaakt in de database (geen lege threads meer).
- Nieuwe component `ChatQuickActions` met de chip-rij.
- Nieuwe component `ChatHistoryDrawer` (shadcn `Sheet`) met de bestaande `listThreads`/`deleteThread` server functions.
- Server route `/api/chat` uitbreiden: accepteert optioneel een image part in het laatste user-bericht en geeft die mee aan het model.
- (Optioneel) Storage bucket `chat-images` met RLS — alleen als we afbeeldingen willen bewaren voor terugkijken; anders sturen we de foto inline mee en bewaren we alleen de tekst.
- i18n keys toegevoegd voor chips, drawer-titel, en welkomsttekst — direct in alle 6 talen (en, nl, ar, fr, de, es).

## Wat blijft hetzelfde

- Bottom nav, AiFab (verdwijnt al op /ai-coach), profiel.
- Database (`chat_threads`, `chat_messages`) en bestaande RLS.
- Model: `google/gemini-3-flash-preview` via Lovable AI Gateway.

## Twee open keuzes

1. **Foto's bewaren of niet?** Bewaren = je ziet ze terug in oude chats (kost wat opslag). Niet bewaren = lichter, foto verdwijnt na het gesprek.
2. **Welkomsttekst**: "Goed je te zien, {voornaam}" (zoals Bevel) of iets neutraler zoals "Hoe kan ik je vandaag helpen?"

Ik kan met optie "foto's niet bewaren" + Bevel-stijl welkomst starten als je niets anders kiest.
