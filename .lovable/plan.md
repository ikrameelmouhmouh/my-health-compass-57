## Fasting Completion Summary

Wanneer de gebruiker een vasten beëindigt (via de "End"-knop), tonen we een feestelijk overzichtsscherm — vergelijkbaar met het workout-summary scherm — in plaats van alleen een korte notificatie.

### Wat komt er op het scherm

- **Header met celebratie**: "Hoera!" (of "Fast complete!" bij doel behaald) of "Fast beëindigd" (bij te vroeg stoppen), met vlam-icoon en confetti-achtige styling.
- **Grote metric-tegels**:
  - Totale vastenduur (bv. `16h 24m`)
  - Doel (bv. `16h`) + percentage behaald
  - Protocol (bv. `16:8`)
  - Nieuwe streak (bv. `4 dagen 🔥`) — alleen als voltooid
- **Bereikte fase** — dit is nieuw en het kern-idee dat gebruiker vroeg:
  Op basis van uren gevast tonen we welke metabole fase(s) de gebruiker heeft doorlopen, met korte uitleg per fase:
  - `0–4h` — Voeding / anabole fase (bloedsuiker & insuline verwerken maaltijd)
  - `4–12h` — Glycogeen-verbranding
  - `12–18h` — Ketose start (lever schakelt om naar vet)
  - `18–24h` — Diepe ketose & autofagie start
  - `24–48h` — Volledige autofagie (celvernieuwing)
  - `48h+` — Groeihormoon-piek, diepe reset
  De hoogst-bereikte fase krijgt een grote highlight-kaart met titel + 2 regels uitleg (net als het referentie-screenshot van de andere app).
- **Fase-tijdlijn**: horizontale strip met 5 vlam-iconen (grijs → oranje) die laat zien welke fases voltooid zijn, met markering waar de gebruiker eindigde.
- **Twee knoppen**: `Klaar` (sluit sheet) en `Nieuwe fast starten` (start meteen dezelfde protocol opnieuw).

### Hoe het aangeroepen wordt

- `stop()` in `useFasting` retourneert nu de zojuist afgeronde `FastEntry` (nu geeft het niets terug). Op de fasting-pagina vangen we die op en zetten `summary` state → toont `<FastingSummarySheet />` als bottom sheet / dialog.
- Ook toonbaar vanuit history: tik op een history-item → "Bekijk samenvatting" opent zelfde sheet met die entry.

### Bestanden

**Nieuw**
- `src/components/fasting/fasting-summary.tsx` — het overzichts-sheet component + `FASTING_PHASES` constant met uur-drempels, titels, beschrijvingen.

**Aangepast**
- `src/lib/dashboard-prefs.ts` — `stop()` retourneert `FastEntry | null`.
- `src/routes/_authenticated/fasting.tsx` — vang resultaat van `stop()`, render `<FastingSummarySheet>`, voeg "bekijk" knop toe aan history-items.
- `src/lib/i18n.tsx` — nieuwe strings voor alle 6 talen (en/nl/ar/fr/de/es):
  - `fast.summary.title_done`, `fast.summary.title_short`
  - `fast.summary.duration`, `fast.summary.goal`, `fast.summary.streak`, `fast.summary.percent`
  - `fast.summary.phaseReached`, `fast.summary.close`, `fast.summary.startAgain`
  - 6× fase-titels + 6× fase-beschrijvingen

### Design notes

- Gebruikt bestaande design tokens (`bg-brand`, `border-border`, `bg-card`) — geen hard-coded kleuren.
- Vlam-iconen uit `lucide-react` (`Flame`) met opacity per fase-status.
- Sheet is dismissible; herhaalt geen data die al in de timer-ring zit — dit is een viering + educatie moment.
