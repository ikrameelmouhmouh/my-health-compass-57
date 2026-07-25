## Doel
In de "Edit workout pagina" lightbox moet het filmpje blijven doorlopen. Zodra je op het groene vinkje drukt (of naar een andere oefening navigeert) start de volgende oefening automatisch met afspelen — tenzij je zelf op pauze hebt gedrukt.

## Wat er nu gebeurt
In `src/routes/_authenticated/admin.exercise-frames.tsx`:
- Bij het wisselen van oefening wordt `playing` gereset naar de waarde van `filmMode` (vaak `false`), dus staat hij stil.
- `gotoExercise()` en de pijltjestoetsen zetten `playing` expliciet op `false`.

## Aanpassing
1. Een `autoPlayRef` (of state `autoPlay`) bijhouden die onthoudt of de gebruiker bewust heeft gepauzeerd:
   - Standaard `true` zodra de lightbox opent.
   - Klik op de play/pauze-knop of spatiebalk zet deze op de nieuwe waarde.
2. Bij wisselen van oefening (groene vinkje, rode kruis, pijlen vooruit/achteruit, exercise-navigatieknoppen) `playing` weer op `autoPlay` zetten in plaats van hard op `false`.
3. Handmatig door frames stappen (pijl links/rechts, frame-knoppen) blijft pauzeren — dat is bewuste bediening — maar het pauzeert alleen die oefening; bij de volgende oefening speelt hij weer door omdat `autoPlay` niet is uitgezet. Alleen de expliciete pauzeknop/spatiebalk zet `autoPlay` uit.
4. Alleen deze lightbox-logica wijzigen; geen andere UI, prompts of data-aanpassingen.
