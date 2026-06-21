# Plan: Aura-inzicht herplaatsen + PWA + widget-API

## Wat we bouwen

1. Aura-kaart weghalen van home (`/profile`) — die verpest het overzicht.
2. Klein **belletje-icoon** in de header van `/profile` met badge bij ongelezen meldingen.
3. **Meldingen-inbox** (sheet) waar Aura's dagelijks inzicht binnenkomt, plus toekomstige meldingen.
4. Compacte, inklapbare **"Aura tip van vandaag"-strip** op home (1 regel) zodat het inzicht niet verdwijnt maar geen ruimte opslokt.
5. **PWA-installatie**: gebruikers kunnen de app als icoon op hun beginscherm zetten.
6. **Publieke widget-API** voor toekomstige echte native iOS/Android widget.

````text
Voor:                              Na:
┌──────────────────────────┐       ┌──────────────────────────┐
│ Nog wakker, Ikrame   ⚙️  │       │ Nog wakker, Ikrame 🔔③⚙️ │
│ maandag 22 juni          │       │ maandag 22 juni          │
│                          │       │                          │
│ [Upgrade banner]         │       │ [Upgrade banner]         │
│                          │       │                          │
│ ┌──────────────────────┐ │       │ ✨ Houd het ritme · meer ▾│
│ │ ✨ Aura's dagelijks   │ │       │                          │
│ │ inzicht ...           │ │  →    │ [Calorieën card]         │
│ │ Advies: ...           │ │       │ [Water/Steps]            │
│ └──────────────────────┘ │       │ ...                      │
│                          │       │                          │
│ [Calorieën card]         │       │                          │
└──────────────────────────┘       └──────────────────────────┘
                                    Belletje opent meldingen-inbox
                                    met het volledige Aura-inzicht
````

## Eerlijk over "widget"

Een echte iOS/Android home-screen widget (WidgetKit / Glance) kan **niet** in deze web-app stack. Daarvoor is later een native app-traject (Capacitor + Swift/Kotlin + App Store/Play Store) nodig.

Wat we **nu** wel doen:
- **PWA-installatie** → app-icoon op telefoon dat de app opent (geen echte widget, wel "app-gevoel").
- **Publieke JSON-API** met het dagelijkse inzicht, zodat een latere native widget die direct kan ophalen.

## Bestanden en wijzigingen

### Database (migratie)
Nieuwe tabel `notifications`:
- `id`, `user_id` (FK auth.users), `type`, `title`, `body`, `read`, `created_at`
- GRANT op `authenticated` en `service_role`
- RLS: gebruiker kan alleen eigen meldingen lezen/wijzigen

### Home-pagina
- `src/routes/_authenticated/profile.tsx`
  - `<AuraInsightCard ...>` weghalen uit de layout (functie blijft als helper voor tekstgeneratie).
  - Belletje-knop toevoegen in header met ongelezen-badge.
  - `<AuraTipStrip />` toevoegen: 1 regel, klikt door naar inbox.

### Nieuwe componenten
- `src/components/notifications-sheet.tsx`: bottom sheet met meldingen, mark-as-read, lege staat.
- `src/components/aura-tip-strip.tsx`: compacte strip met de adviesregel van vandaag.

### Server functions
- `src/lib/notifications.functions.ts`:
  - `listNotifications()` — eigen meldingen van de gebruiker.
  - `markRead({ id })` / `markAllRead()`.
  - `ensureTodayAura({ snapshot })` — genereert/upsert dagelijks Aura-inzicht (één per dag per user).

### PWA-installatie (manifest-only, geen service worker)
- `public/manifest.webmanifest` met naam Vita, theme/background color uit huidige design tokens, `display: standalone`.
- `public/icons/icon-192.png` en `icon-512.png` (gegenereerd uit huidig logo).
- Tags in `src/routes/__root.tsx`: `<link rel="manifest" ...>`, `<meta name="theme-color" ...>`, `<link rel="apple-touch-icon" ...>`.

### Widget-API (voorbereid voor later)
- `src/routes/api/public/widget/aura.ts`:
  - GET endpoint dat een korte token-parameter accepteert (`?token=...`) waarmee de gebruiker zichzelf identificeert.
  - Token = HMAC van `user_id + WIDGET_SECRET`, gebruiker kan deze later in instellingen kopiëren naar de widget.
  - Retourneert `{ title, body, advice, date, calorieTarget, steps, waterMl }` van het laatste Aura-inzicht.
- Nieuwe secret: `WIDGET_SECRET` (zelf gegenereerd, server-side).

### Vertalingen (alle 6 talen)
Toevoegen aan `src/lib/i18n.tsx`:
- `notif.title` — "Meldingen"
- `notif.empty` — "Geen meldingen"
- `notif.mark_all_read` — "Alles als gelezen markeren"
- `today.aura.strip_more` — "meer"
- `today.aura.open_inbox` — "Open meldingen"

### Niet in scope nu
- Echte iOS/Android home-screen widget (native traject — later).
- Push-notificaties (apart traject met VAPID — er staat al een VAPID-secret, maar push-flow is een eigen verhaal).
- Aura-inzicht regenereren op een server-cron (komt vanzelf bij eerste app-open van de dag; cron kan later).

## Volgorde van uitvoering bij goedkeuring
1. Migratie `notifications` tabel + RLS.
2. Server functions voor notifications + `ensureTodayAura`.
3. UI: belletje + meldingen-sheet + tip-strip; Aura-kaart verwijderen van home.
4. Vertalingen voor alle 6 talen.
5. PWA-manifest + iconen + head-tags.
6. Widget-API endpoint + `WIDGET_SECRET`.
7. Korte controle in preview.