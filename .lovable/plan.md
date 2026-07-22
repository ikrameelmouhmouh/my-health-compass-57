## Doel

De twee oefening-frames moeten samen een mini-filmpje vormen: **exact dezelfde camera, hoek, afstand, belichting en achtergrond** — alleen het lichaam beweegt van start- naar eindpositie. Nu krijg je bij Pull Up bijvoorbeeld frame 1 van voren en frame 2 van achteren, waardoor het geen beweging lijkt maar twee losse foto's.

## Wat er nu misgaat

In `src/routes/api/admin/generate-exercise-frames.ts` worden de twee frames **onafhankelijk parallel** gegenereerd met twee losse prompts. Het model kiest per call zelf een camerahoek, dus start en eind matchen niet.

## Aanpak

1. **Prompt herschrijven** in `buildDefaultPrompt()` zodat er expliciet gevraagd wordt om:
   - Vaste camerapositie, brandpuntsafstand en afstand tot onderwerp
   - Zelfde achtergrond, licht en schaduw in beide frames
   - Zelfde mannequin (kleur, proporties, kleding)
   - Een vaste hoek per oefening (meestal zij-aanzicht, tenzij vooraanzicht duidelijker is — bv. Lat Pulldown vooraanzicht, Deadlift zij-aanzicht)

2. **Sequentieel genereren met beeld-referentie**: eerst frame 0 (start) genereren, dan frame 1 (eind) genereren **met frame 0 als input-image** via de image-edit modus van `google/gemini-3.1-flash-image`. Zo houdt het model camera, licht en mannequin identiek en verandert alleen de pose. Dit is exact waar Gemini image-editing goed in is.

   Body voor frame 1 wordt dan:
   ```
   messages: [{ role: "user", content: [
     { type: "text", text: "Same scene, same camera, same lighting, same mannequin. Only change: move to the END position of the movement (peak contraction)." },
     { type: "image_url", image_url: { url: "data:image/jpeg;base64,<frame0>" } }
   ]}]
   modalities: ["image", "text"]
   ```

3. **Per-oefening camerahoek**: uitbreiding op `buildDefaultPrompt(id)` om per bewegingstype de beste hoek te kiezen (zij-aanzicht voor squats/deadlifts/rows, vooraanzicht voor pulldowns/presses waarbij symmetrie belangrijk is, 3/4 voor push-ups). Simpele lookup op basis van id-patroon.

4. **Bestaande admin-flow blijft werken**: je kunt bestaande afbeeldingen opnieuw genereren met de "🔄" knop of "Alles resterend" — de nieuwe prompt + image-to-image pipeline vervangt dan de oude frames in het `exercise-frames` bucket. De 402-fout bij Deadlift is een aparte gateway-billing melding en staat los hiervan.

## Bestanden

- `src/routes/api/admin/generate-exercise-frames.ts` — nieuwe prompt-opbouw, sequentiële generatie, frame-0 als referentie voor frame-1, per-oefening camerahoek.

Geen andere bestanden hoeven aangepast te worden; de weergavecomponenten tonen gewoon de nieuwe frames zodra ze opnieuw gegenereerd zijn.

## Wat jij daarna doet

Op `/admin/exercise-frames` op "Alles resterend" klikken (of individueel "🔄") om de bibliotheek opnieuw te genereren met de gematchte frames.
