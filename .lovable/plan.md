# Alle oefening-afbeeldingen opnieuw genereren

## Waarom niet "in één keer alles"

- ~500 oefeningen × 2 frames = ~1000 afbeeldingen. Dat past niet in één berichtbeurt en kan ik niet als 1000 bundle-imports in de app zetten (build explodeert).
- Elke afbeelding kost credits en tijd. We moeten dit als **doorlopend proces** aanpakken, niet als één-shot.

## Aanpak: server-generatie + Cloud Storage + admin-scherm

### 1. Nieuwe storage bucket `exercise-frames` (publiek)
- Sleutel-formaat: `{exercise-id}-0.jpg` en `{exercise-id}-1.jpg`
- Publiek lezen; alleen server-role schrijven

### 2. Nieuwe tabel `exercise_frame_jobs`
Houdt bij welke oefeningen al gegenereerd zijn, welke gefaald zijn, en welke prompt gebruikt is. Kolommen: `exercise_id` (pk), `status` (`pending`/`done`/`failed`/`bad`), `prompt`, `updated_at`, `error`.

### 3. Server route `POST /api/generate-exercise-frames`
- Input: `{ exerciseId, force?: boolean }`
- Bouwt een strakke prompt per oefening:
  - "Neutral androgynous 3D mannequin, matte grey skin, no hair, no facial features, no gender markers"
  - "Studio white background, soft shadow"
  - **Voor machine-oefeningen**: "sitting on/using a [machine type] gym machine, machine clearly visible in the frame"
  - Twee frames: `-0` = startpositie, `-1` = eindpositie/contractie
- Roept AI Gateway aan met `google/gemini-3.1-flash-image` (Nano Banana 2 — snelst + goede kwaliteit)
- Upload beide frames naar `exercise-frames` bucket via `supabaseAdmin.storage`
- Update `exercise_frame_jobs`-rij

### 4. Nieuwe helper `getExerciseFrames(ex)`
Vervangt de huidige bundle-imports voor de niet-curated oefeningen:
- Geeft direct de publieke Storage URL's terug (`{project-url}/storage/v1/object/public/exercise-frames/{id}-0.jpg`)
- Als er nog geen frame is: neutrale placeholder + trigger achtergrond-generatie

### 5. Admin-scherm `/_authenticated/admin/exercise-frames`
- Alleen zichtbaar voor jouw account (via `has_role`-check of hard user-id gate)
- Toont voortgangsbalk: X van ~500 klaar, Y gefaald
- Knop **"Genereer volgende 20"** → verwerkt batch achter elkaar met live UI-update per klaar frame
- Grid met alle oefeningen: preview van beide frames, knop **"Opnieuw"** per oefening als je een slechte ziet (zoals die Ab Crunch)
- Filter: alleen tonen die `pending`/`failed`/`bad` zijn

### 6. Bestaande 26 curated frames blijven
De handmatig geïmporteerde frames (`wlp0`, `sq0`, etc.) blijven voorlopig zoals ze zijn. Als je later ook die wilt vervangen, kan dat via dezelfde admin-tool (knop "Overschrijf curated").

## Wat je krijgt

1. Bucket + tabel + server route zijn direct klaar
2. Admin-scherm werkt vanaf het moment dat je deze wijziging aanvaardt
3. **Jij bepaalt zelf het tempo**: batch van 20 doen, kijken, nog eens 20, etc. Geen 3 uur wachten op één turn
4. Foute individuele afbeeldingen (zoals de Ab Crunch) fix je met één klik

## Technische details

- **Model**: `google/gemini-3.1-flash-image` via `/v1/images/generations` (server-side, geen streaming want we schrijven direct naar Storage)
- **Prompt-template per equipment-type**: aparte varianten voor `Machine`, `Cable`, `Barbell`, `Dumbbell`, `Bodyweight`, `Kettlebell`, `Band`, `TRX`, `Smith Machine`, `Landmine`, `EZ Bar`. Zorgt dat de juiste apparatuur zichtbaar is
- **Batch grootte**: 20 per klik (voorkomt Worker-timeout van 60s; ~2s per beeld × 20 × 2 frames = ~80s → we doen ze parallel in 4 groepen)
- **Idempotent**: bestaande `done` overslaat, tenzij `force`

## Ruwe schatting

- ~500 oefeningen × 2 frames = ~1000 API-calls
- Credits: substantieel maar overzichtelijk per batch — jij ziet in het admin-scherm de teller lopen
- Doorlooptijd: als je elke ~10 minuten een batch triggert, is het in een middag klaar

## Bevestiging

Klopt dit met wat je bedoelt? Dan bouw ik in de volgende beurt: bucket + tabel + server route + admin-scherm + nieuwe `getExerciseFrames`-helper. Genereren start daarna zodra jij op de knop drukt.
