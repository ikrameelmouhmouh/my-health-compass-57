
## Wat ik begrepen heb

Je wilt dat de activiteiten op het **Activiteiten**-tabblad (zwemmen, fietsen, hardlopen, hiken, voetbal, yoga, HIIT…) net als de gym-workouts gestart kunnen worden — maar zonder sets/reps. In plaats daarvan:

- **Live timer** (mm:ss, telt op vanaf 0)
- **Live kalorieën-teller** die meeloopt op basis van duur × kcal/uur × gewicht
- **Pauze / hervat** knop (timer en kcal pauzeren)
- **Stop** knop → opent een **afsluitscherm** zoals bij gym, maar afgestemd op cardio
- Later koppelbaar aan **Apple HealthKit / Apple Watch** zodat kcal & hartslag automatisch ingelezen worden i.p.v. berekend

Apple Watch companion-app komt later — dit scherm wordt zo ontworpen dat HealthKit-data straks gewoon de geschatte waarden vervángt zonder UI-herontwerp.

---

## Wat ik ga bouwen

### 1. Nieuw scherm: `/activity-session/$activityId`
Naar dit scherm navigeer je vanuit een tap op een activiteit-kaartje (Zwemmen, Fietsen, etc.).

**Layout (van boven naar onder):**

```text
┌─────────────────────────────┐
│  ← Terug          Zwemmen   │
│                             │
│        ╭───────────╮        │
│        │   24:13   │  ← grote timer (mm:ss)
│        ╰───────────╯        │
│                             │
│   🔥 187 kcal               │  ← live geschatte kcal
│   ❤️  — bpm  (HealthKit)    │  ← placeholder tot HealthKit
│   📏 ~2,1 km  (HealthKit)   │  ← placeholder voor afstand
│                             │
│   [  Pauze  ]   [  Stop  ]  │
│                             │
│   Bron: schatting           │  ← later: "Apple Watch"
└─────────────────────────────┘
```

**Gedrag:**
- Timer start automatisch bij openen, telt elke seconde op
- Pauze → timer & kcal bevriezen, knop wordt "Hervat"
- Stop → opent afsluitscherm (zie §3)
- Terug-knop tijdens actieve sessie → bevestigingsdialoog ("Workout afbreken?")
- Scherm blijft aan via `navigator.wakeLock` (zoals een Apple Watch workout)

### 2. Kalorieën-berekening (tussenoplossing tot HealthKit)
```text
kcal = (kcalPerHour × gewicht_kg/70) × (verstreken_seconden / 3600)
```
- `kcalPerHour` per activiteit komt uit de bestaande `ACTIVITIES`-lijst (zwemmen 500, fietsen 450, etc.)
- `gewicht_kg` uit profiel; valt terug op 70 kg als onbekend
- Afgerond naar hele kcal, update elke seconde
- Velden voor **hartslag** en **afstand** worden alvast getoond als `—` met label "HealthKit" zodat je straks alleen de databron hoeft te vervangen

### 3. Afsluitscherm (na Stop)
Zelfde stijl als het gym `session-summary` scherm, maar cardio-velden:

- Activiteit + datum
- **Duur** (totale tijd minus pauze)
- **Kcal verbrand**
- **Gem. hartslag** / **Max hartslag** (leeg tot HealthKit)
- **Afstand** (leeg tot HealthKit)
- Optioneel notitieveld ("Hoe voelde het?")
- Knoppen: **Opslaan** / **Verwijderen**

Opslaan slaat de sessie op in dezelfde `workout_sessions`-tabel als gym, met een `kind: "activity"` markering plus `activity_id`, `duration_sec`, `kcal`, `paused_sec`, `source: "estimate" | "healthkit"`. Hierdoor verschijnen activiteiten in dezelfde geschiedenis/voortgang als gym-workouts.

### 4. HealthKit-voorbereiding (geen Apple-code nu)
- Datastructuur heeft al velden voor `heart_rate_avg`, `heart_rate_max`, `distance_m`, `source`
- Eén `getLiveMetrics()` hook in de sessie-pagina; nu retourneert die `{ kcal: estimated, hr: null, distance: null, source: "estimate" }`. Wanneer de Apple Watch-app er is, vervangt die functie haar return-waarden door echte HealthKit-data — UI verandert niet.

### 5. Extra aanbevelingen voor het sessie-scherm
Naast pauze/timer/kcal raad ik aan om standaard mee te nemen:
- **Wake-lock** zodat het scherm niet uitvalt
- **Lap / ronde-knop** (handig bij zwemmen baantjes of hardlopen)
- **Audio-cue elke 5 min** ("10 minuten, 95 kcal") — zelfde audio-helper als rest-beep
- **Intensiteits-keuze vóór start** (rustig / normaal / intens) → past `kcalPerHour` aan met ×0.8 / ×1.0 / ×1.25
- **Achtergrond-haptiek** bij pauze/hervat/stop

Laat me weten welke je wilt; standaard zet ik wake-lock + intensiteit aan, lap-knop en audio-cues als optioneel later.

### 6. Vertalingen
Alle nieuwe UI-strings worden direct toegevoegd in en/nl/ar/fr/de/es in `src/lib/i18n.tsx`.

---

## Bestanden

- **Nieuw:** `src/routes/_authenticated/activity-session.$activityId.tsx` — het sessie-scherm
- **Nieuw:** `src/components/workout/activity-summary.tsx` — afsluitscherm (gemodelleerd naar `session-summary.tsx`)
- **Nieuw:** `src/lib/activity-session.ts` — timer/pauze/kcal-logica + `getLiveMetrics()` hook (HealthKit-ready)
- **Bewerken:** `src/routes/_authenticated/fitness.tsx` — activity-kaartjes worden `<Link>` naar de nieuwe route
- **Bewerken:** `src/lib/i18n.tsx` — nieuwe keys in 6 talen
- **Migratie:** kleine kolommen-uitbreiding op `workout_sessions` (`kind`, `activity_id`, `duration_sec`, `kcal`, `paused_sec`, `heart_rate_avg`, `heart_rate_max`, `distance_m`, `source`) of een aparte `activity_sessions`-tabel — kies ik op basis van de huidige schema-vorm tijdens implementatie

Klopt dit met wat je voor je zag? Dan bouw ik het zo.
