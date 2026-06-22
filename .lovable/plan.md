## Probleem

Je workouts en activiteiten worden nu **alleen lokaal opgeslagen** in de browser (localStorage), niet in je account. Daarom verdwijnen ze als je:
- in een andere browser of incognito-tab opent
- je cache wist
- naar een ander apparaat (telefoon ↔ laptop) gaat
- de preview-URL ververst na een nieuwe build

De database-tabel `workout_sessions` bestaat al, maar de app schrijft er nooit naartoe — alles gaat naar `localStorage.fitness.sessions.v1` en `localStorage.fitness.activity-sessions.v1`.

## Oplossing

Alle afgeronde sessies opslaan in je account (Lovable Cloud), zodat ze overal beschikbaar zijn en niet meer verdwijnen.

### 1. Gym-workouts (kracht/sets) → bestaande tabel `workout_sessions` + `workout_sets`
- Bij "Finish workout": insert in `workout_sessions` (naam, duur, volume, reps, notes) + per set een rij in `workout_sets`.
- PRs blijven via `exercise_prs` (al aanwezig).
- localStorage blijft als snelle cache + offline-buffer; bij volgende login wordt er gemerged vanuit de cloud.

### 2. Cardio/sport-activiteiten (zwemmen, fietsen, …) → nieuwe tabel `activity_sessions`
Cardio heeft andere velden dan kracht (geen sets, wel duur/kcal/hartslag/afstand), dus aparte tabel:

```text
activity_sessions
- id, user_id
- activity_id (text, bv. 'swimming')
- activity_name (text)
- started_at, ended_at, duration_seconds, paused_seconds
- kcal (numeric, nullable — komt later van Apple Watch)
- heart_rate_avg, heart_rate_max (nullable)
- distance_m (nullable)
- source ('manual' | 'healthkit')
- notes
```
Met RLS: alleen eigen rijen lezen/schrijven.

### 3. Lijsten lezen uit de cloud
- Geschiedenis-/profielschermen die nu `readHistory()` uit localStorage lezen, omschakelen naar Supabase-queries (gefilterd op `user_id`, met fallback naar localStorage als offline).

### 4. Migratie van bestaande lokale data
Bij eerstvolgende login: alle nog niet-gesynchroniseerde sessies uit localStorage één keer uploaden, dan markeren als `synced`.

## Wat er niet verandert
- UI van workout- en activiteitenscherm blijft hetzelfde.
- Timer/pauze/finish-flow blijft hetzelfde.
- Apple Watch / HealthKit-velden blijven leeg tot die integratie er is.

## Technische details
- Nieuwe migratie: tabel `activity_sessions` + GRANTs + RLS (`auth.uid() = user_id`).
- `src/lib/workout-session.ts`: in `finish()` ook `supabase.from('workout_sessions').insert(...)` en `workout_sets` bulk-insert.
- `src/lib/activity-session.ts`: in `finish()` ook `supabase.from('activity_sessions').insert(...)`.
- Sync-helper `src/lib/session-sync.ts` die bij login openstaande lokale sessies pusht.
- Foutafhandeling: bij netwerkfout sessie lokaal markeren als `pendingSync: true` en later opnieuw proberen.

Akkoord? Dan zet ik dit om.