## Doel

De 26 oefeningen in `src/assets/exercises/` (bench press, squat, hip thrust, deadlift, etc.) krijgen:
1. **Nieuwe neutrale afbeeldingen** — één androgyn 3D-poppetje in sportondergoed (donkere shorts + crop top), grijze huid, geen duidelijk geslacht. Per oefening 2 frames (start + eind) zoals nu.
2. **Correcte afbeeldingen per oefening** — elke afbeelding wordt apart geprompt op de juiste houding (bv. barbell hip thrust = rug tegen bankje, heupen omhoog met barbell).
3. **Vertalingen** — de oefeningnamen en stappen worden vertaald naar alle 6 talen (en, nl, ar, fr, de, es).

## Wat er verandert

### Afbeeldingen (26 oefeningen × 2 frames = 52 nieuwe afbeeldingen)
Wide Leg Press, Barbell Back Squat, Romanian Deadlift, Leg Extension, Lying Leg Curl, Barbell Hip Thrust, Standing Calf Raise, Barbell Bench Press, Incline Dumbbell Press, Cable Chest Fly, Push Up, Lat Pulldown, Barbell Bent Over Row, Seated Cable Row, Pull Up, Conventional Deadlift, Overhead Press, Dumbbell Lateral Raise, Face Pull, Barbell Curl, Hammer Curl, Triceps Pushdown, Skull Crusher, Plank, Hanging Leg Raise, Cable Crunch.

- Oude `*-male-*.jpg` en `*-female-*.jpg` bestanden worden vervangen door `*-0.jpg` en `*-1.jpg` (neutraal).
- Elke afbeelding krijgt een specifieke prompt die de juiste oefeningshouding beschrijft, zodat hip thrust er ook echt uitziet als hip thrust.

### Code (`src/lib/exercise-library.ts`)
- `ExerciseVariants` type + `variants()` helper + `male/female` splitsing wordt verwijderd.
- `FALLBACK_BY_MUSCLE` blijft, maar verwijst naar neutrale frames.
- `getExerciseFrames()` en `hasGenderVariants()` worden vereenvoudigd (geen `gender` parameter meer).
- Aanroepen elders in de app die `gender` doorgeven worden aangepast.

### Vertalingen (`src/lib/i18n.tsx`)
- Per oefening: vertaalkey voor `name` + per stap een vertaalkey.
- Oefeningnamen worden via i18n opgehaald in plaats van hardcoded Engels.
- Alle 6 talen krijgen complete vertalingen (en, nl, ar, fr, de, es).

## Wat er NIET verandert
- De ~470 andere catalogus-oefeningen (via `mk()`) blijven Engels met placeholder-icoon + fallback per spiergroep. Die kunnen we later in een tweede ronde doen.
- Geen wijzigingen aan workout-tracking, sets, reps, etc.

## Volgorde van uitvoering
1. Eerst **1 test-afbeelding** genereren (bv. barbell hip thrust) zodat je de stijl kunt goedkeuren vóór de andere 51.
2. Na akkoord: rest van de afbeeldingen + code-wijzigingen + vertalingen in één keer.

## Credits-waarschuwing
Je hebt nu **176 credits** over. 52 afbeeldingen genereren + code + vertalingen kan flink wegnemen. Als het halverwege te veel wordt, kunnen we pauzeren.
