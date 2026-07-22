Aanbeveling: **optie 1** — per oefeningtype een vaste camera- en machinewinkel instellen. De generieke regex in `cameraAngleFor()` is te broos voor machine-oefeningen zoals Wide Leg Press, waarbij het apparaat in het ene frame aan de zijkant staat en in het andere verdwijnt. Door per oefening expliciet te zeggen "camera kijkt vanaf de voetplaat, hele machine in beeld, mannequin liggend op rug", krijg je twee echte stills uit dezelfde film.

## Plan

### 1. Uitbreiden van oefening-gegevens met camera-instructies
- Voeg een nieuw metadata-veld toe aan de oefeningen in `src/lib/exercise-library.ts` (of een aparte `exercise-camera-hints.ts`) zodat we per `id` kunnen vastleggen:
  - `cameraAngle` (bijv. "side", "front", "3/4", "machine-rear", "machine-side")
  - `machineView` (bijv. "vanaf voetplaat", "vanaf zijkant", "hele toestel in beeld")
  - `bodyOrientation` (bijv. "liggend op rug", "zittend borstkas naar camera", "zijkant")
  - `startPose` en `endPose` korte beschrijving
- Begin met de ~50 machine-oefeningen en de meest voorkomende compound-oefeningen; de rest kan tijdelijk een generieke fallback gebruiken.

### 2. API-aanpassing voor consistente framing
- Pas `src/routes/api/admin/generate-exercise-frames.ts` aan:
  - Gebruik de per-oefening metadata als bron voor zowel frame 0 als frame 1.
  - Bouw het prompt zo op dat de camera, machinewinkel, licht en achtergrond als één "locked-off shot" worden beschreven.
  - Versterk het image-edit-prompt voor frame 1 met expliciete instructies:
    - "behoud dezelfde hoek ten opzichte van het apparaat"
    - "het apparaat moet in beide frames op exact dezelfde plek staan"
    - "draai NOOIT om de oefener heen"
  - Behoud de image-to-image aanpak (frame 0 → frame 1), maar voeg een extra "seed"-achtige consistentie-instructie toe (zelfde studio, zelfde poppetje, zelfde kleding).

### 3. Machine-oefeningen expliciet "locken"
- Voor machine-oefeningen (Leg Press, Chest Press, etc.) voeg je een specifieke regel toe:
  - "Camera kijkt vanaf een vast punt: bij leg press vanaf de voetplaat-kant, hele sled + frame in beeld, mannequin liggend op rug."
  - "In beide frames moet hetzelfde deel van de machine zichtbaar zijn."
  - "De beweging is alleen de sled die heen en weer gaat, camera beweegt niet mee."

### 4. Admin UI-verbetering
- In `src/routes/_authenticated/admin.exercise-frames.tsx` voeg je toe:
  - Een "🔄 Forceer opnieuw" knop per oefening (met `force: true`).
  - Een "Markeer als slecht" knop die de `status` op `"bad"` zet in `exercise_frame_jobs`, zodat je ze later eenvoudig kunt filteren en opnieuw genereren.
  - Toon de huidige camera-instructie in de lijst zodat je snel ziet of een oefening al een expliciet regel heeft.

### 5. Test- en regeneratie-rondje
- Regenereer eerst de volgende problematische oefeningen met de nieuwe metadata:
  - `wide-leg-press`
  - `leg-extension`
  - `lying-leg-curl`
  - `chest-press-machine` (indien aanwezig)
  - `lat-pulldown`
- Vergelijk frame 0 en frame 1 in de admin UI: zelfde achtergrond, zelfde kant van het lichaam, zelfde apparaatpositie.

### 6. Fallback en uitbreiding
- Zolang niet alle oefeningen een metadata-regel hebben, blijft de huidige regex-fallback actief.
- Voor nieuwe oefeningen in de bibliotheek wordt de metadata verplicht bijgevoegd, zodat dezelfde fout niet terugkomt.

## Technische details
- **Bestanden die worden aangepast:**
  - `src/lib/exercise-library.ts` (of nieuw `src/lib/exercise-camera-hints.ts`)
  - `src/routes/api/admin/generate-exercise-frames.ts`
  - `src/routes/_authenticated/admin.exercise-frames.tsx`
- **Geen schema-wijzigingen nodig** voor de prompts zelf; `exercise_frame_jobs` heeft al een `status`-kolom die we `"bad"` kunnen gebruiken.
- **Kosten**: het regenereren van de 5 testoefeningen en later de machine-categorie is beperkt; pas daarna "Alles resterend" aan.

## Wat dit oplevert
- Twee frames die als één kort oefenfilmpje aanvoelen: zelfde poppetje, zelfde studio, zelfde camerahoek, alleen de houding verandert.
- Machine-oefeningen tonen het apparaat consistent in beide frames, zonder dat het "draait" of verdwijnt.
- De admin-pagina geeft jou de regie om individuele oefeningen te markeren, opnieuw te genereren en te controleren.