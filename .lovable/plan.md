# Intermittent Fasting integreren onder 'Eten'

Doel: vasten logisch en zichtbaar maken zonder de bottom nav te veranderen. We houden de 5 tabs (Home, Eten, Workouts, Social, Vooruitgang) en geven vasten een prominente plek bovenaan `/nutrition`, met de bestaande snelkoppeling op het startscherm intact.

## Wat er verandert

### 1. `src/routes/_authenticated/nutrition.tsx` — Fasting-sectie bovenaan
Direct onder de dag-header, vóór de meals-lijst, een compacte Fasting-kaart:
- **Als er een actief venster is**: live timer (uren:minuten), voortgangsring, "Stop vasten"-knop, gekozen protocol (16:8, 18:6, OMAD…).
- **Als er geen actief venster is**: laatste status ("12u geleden gestopt"), primaire knop "Start vasten", secundaire link "Geschiedenis".
- Volledige UI blijft op `/fasting` (geschiedenis, protocol kiezen, instellingen). De kaart linkt erheen via "Bekijk alles".

### 2. `src/components/bottom-nav.tsx` — ongewijzigd
5 tabs blijven exact zoals nu. Geen Fasting-tab, geen verschuiving van Vooruitgang.

### 3. Startscherm (`/profile`) — bestaande Fasting-kaart blijft
De huidige snelle toegang op het startscherm blijft staan; dat is nu de tweede ingang naast `/nutrition`.

### 4. Route `/fasting` — blijft bestaan
Bereikbaar via de kaart op `/nutrition` en de kaart op het startscherm. Niet meer via de bottom nav (was er ook niet).

### 5. i18n
Nieuwe keys voor de inline Fasting-kaart op nutrition (`nut.fastingTitle`, `nut.fastingActive`, `nut.fastingIdle`, `nut.startFast`, `nut.stopFast`, `nut.viewAll`) in alle 6 talen.

## Waarom deze keuze (kort)

- **Overzicht behouden**: 5 tabs is iOS-best-practice; 6 wordt visueel druk en labels worden krap.
- **Mentaal model klopt**: vasten = wanneer je eet, dus thuis onder 'Eten'.
- **Twee ingangen**: startscherm-kaart voor snelle toegang, nutrition-sectie voor context naast je maaltijden.
- **Geen verlies**: 'Vooruitgang' (gewicht/trends) blijft een eigen tab — die data is te belangrijk om te verstoppen.

## Niet in scope

- Geen wijziging aan de bottom nav.
- Geen verplaatsing van Vooruitgang.
- Geen wijziging aan de fasting-logica/datamodel — alleen een nieuwe weergave-kaart die de bestaande state hergebruikt.
