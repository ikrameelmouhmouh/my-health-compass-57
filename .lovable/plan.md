Doel: In `/_authenticated/admin/exercise-frames` kunnen de twee kleine preview-afbeeldingen (huidig `size-14`) worden aangeklikt/tikken om ze groot te bekijken, zodat de gebruiker de gegenereerde frames beter kan controleren op consistentie.

## Wijzigingen

1. **Lightbox-component in admin route**
   - Voeg een lokale modal/lightbox toe in `src/routes/_authenticated/admin.exercise-frames.tsx`.
   - Gebruik bestaande dialog/overlay patronen of een eenvoudige `AnimatePresence`/`framer-motion` overlay als die al in het project gebruikt wordt; anders een lichte CSS-only overlay.
   - Onthoudt de index (0 of 1) van het aangeklikte frame.

2. **Klikgedrag thumbnails**
   - Maak de twee `<img>`-thumbnails klikbaar (`cursor-pointer`).
   - Open de lightbox bij click/tap.
   - Behoud huidige layout, afmetingen en statusicons.

3. **Lightbox UI**
   - Toon het geselecteerde frame groot (bijv. max 80vw / 80vh).
   - Voeg pijlknoppen of swipe/klik-links-rechts toe om tussen frame 0 en 1 te wisselen binnen dezelfde oefening.
   - Sluit-knop (ESC en klik buiten de afbeelding).

4. **Toegankelijkheid / i18n**
   - Voeg `aria-label` toe voor openen/sluiten/volgende/vorige.
   - Geen nieuwe zichtbare UI-strings nodig behalve eventuele `alt`- en `title`-teksten; indien wel nieuwe strings ontstaan, vertalen naar alle 6 talen in `src/lib/i18n.tsx`.

5. **Testen**
   - Bouw controle (`bun run build`) of typecheck (`tsgo`).
   - Open de admin-pagina, klik op een klaar oefening en controleer of beide frames vergroot zijn te bekijken en te wisselen.

## Niet in scope
- Generatie-prompts wijzigen.
- Storage- of database-schema wijzigen.
- Gedrag van reset/generatie-knoppen aanpassen.

## Technische details
- Bestand: `src/routes/_authenticated/admin.exercise-frames.tsx`.
- Afhankelijkheden: waarschijnlijk geen nieuwe packages; hergebruik bestaande UI-primitives indien beschikbaar (Dialog, Portal, etc.).