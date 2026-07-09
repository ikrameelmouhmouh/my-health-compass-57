## Vasten-status tijdlijn bovenaan (tot 72 uur)

Horizontaal scrollbare **fase-tijdlijn** bovenaan `/fasting`. In één oogopslag zie je welk uur bij welke fase hoort, én tijdens een actieve vast wordt de huidige fase gemarkeerd. Fases lopen door tot **72h**.

### Nieuwe fase-indeling (8 stadia, 0 → 72h+)

| Lv | Bereik | Key | Titel (NL) |
|----|--------|-----|------------|
| 1 | 0–4h   | fed        | Voeding & anabole fase |
| 2 | 4–8h   | glycogen   | Glycogeen-verbranding |
| 3 | 8–12h  | switch     | Overschakelen naar vasten-modus |
| 4 | 12–18h | ketosis    | Ketose start |
| 5 | 18–24h | deepKeto   | Diepe ketose |
| 6 | 24–48h | autophagy  | Autofagie (cel-opruiming) |
| 7 | 48–72h | growth     | Groeihormoon-piek |
| 8 | 72h+   | reset      | Diepe metabolische reset |

Vervangt de huidige 6-fase constante in `FASTING_PHASES` (`src/components/fasting/fasting-summary.tsx`) — één bron van waarheid, dus de completion-summary gebruikt dezelfde fases.

### Wat komt erbij

1. **Horizontale fase-strip** (nieuw, bovenaan `/fasting`)
   - 8 iconen naast elkaar met chevrons ertussen (zoals de referentie)
   - Per fase: icoon + uurbereik-chip (`0-4h`, `4-8h`, …, `48-72h`, `72h+`)
   - Actieve vast: huidige fase = brand-ring + pulse; bereikt = vol gekleurd; toekomstig = gedimd
   - Auto-scrollt naar huidige fase

2. **Tap op fase → detail-sheet** (nieuwe component)
   - Zelfde look als bestaande `FastingSummarySheet`
   - Lv.N badge, titel, uurbereik, uitgebreide beschrijving, prev/next tussen fases

3. **Iconen** (lucide-react, geen assets)
   - fed `Utensils` · glycogen `Droplet` · switch `ArrowRightLeft` · ketosis `Flame` · deepKeto `Flame` · autophagy `RefreshCw` · growth `Sparkles` · reset `Zap`

4. **Vertalingen** (6 talen: en, nl, ar, fr, de, es)
   - Nieuwe keys per fase: `title`, `range`, `desc` (kort, gebruikt in strip + summary) en `long` (uitgebreid, gebruikt in sheet)
   - Nieuwe key `fast.status.title` ("Status")
   - Bestaande 6-fase keys uitgebreid naar 8

### Bestanden

- **Nieuw**: `src/components/fasting/fasting-phase-strip.tsx`
- **Nieuw**: `src/components/fasting/fasting-phase-sheet.tsx`
- **Aangepast**: `src/components/fasting/fasting-summary.tsx` — `FASTING_PHASES` uitgebreid naar 8 stadia (72h)
- **Aangepast**: `src/routes/_authenticated/fasting.tsx` — strip bovenaan renderen op basis van verstreken uren
- **Aangepast**: `src/lib/i18n.tsx` — 8 fases × {title, range, desc, long} in 6 talen + `fast.status.title`

### Wat NIET verandert

- Timer-ring, protocol-picker, geschiedenis, insight cards, streak
- Geen backend/DB/dependencies
- Completion-summary blijft werken (deelt `FASTING_PHASES`)

### ASCII schets

```text
┌────────────────────────────────────────────────┐
│  [<]           Vasten            [•••]         │
├────────────────────────────────────────────────┤
│ (🍴)»(💧)»(⇄)»(🔥)»(🔥)»(♻)»(✨)»(⚡)  ← scroll →│
│ 0-4  4-8 8-12 12-18 18-24 24-48 48-72 72+     │
│              ▲ huidige                          │
├────────────────────────────────────────────────┤
│              ╭──────────╮                       │
│              │  16 : 42  │  ← bestaande ring   │
│              ╰──────────╯                       │
│           [Vasten voltooien]                    │
└────────────────────────────────────────────────┘
```
