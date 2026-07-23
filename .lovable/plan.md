## Doel
Als je in de lightbox op ▶ (of op de "Speel film"-thumbnail) drukt, blijft de crossfade tussen frame 1 en 2 oneindig doorloopen — heen en weer, zonder te stoppen — tot je op pauze drukt, met de pijltjes naar een specifiek frame springt, of de lightbox sluit.

## Wat er nu misgaat
In `Lightbox` (src/routes/_authenticated/admin.exercise-frames.tsx) hangt de loop-interval af van `frameIndex` en `onChange` in de effect-deps. Elke tick verandert `frameIndex` in de parent-state, waardoor de effect direct opnieuw wordt opgezet en de timer opnieuw begint — dat voelt onregelmatig en stopt soms zichtbaar na één crossfade. De tile-versie (`FrameAnimation`) loopt al correct met interne state; dat patroon trekken we door naar de lightbox.

## Wijziging
Alleen in `src/routes/_authenticated/admin.exercise-frames.tsx`, component `Lightbox`:

1. Loop-interval loskoppelen van `frameIndex`/`onChange`:
   - Effect-deps worden `[playing, filmSpeed, value?.exerciseId]` (dus alleen bij oefening-wissel / play-toggle / snelheidswissel opnieuw opzetten, niet elke tick).
   - Binnen de interval de nieuwe frame afleiden uit de vorige tick via een lokale ref (`currentFrameRef`) i.p.v. uit de gesloten `frameIndex`, zodat de loop 0→1→0→1… blijft doorgaan.
2. Bij pijltje-klik (`ChevronLeft` / `ChevronRight`): `setPlaying(false)` blijft, en de ref wordt bijgewerkt zodat de loop bij volgende play verder gaat vanaf het gekozen frame.
3. Bij oefening-wissel / lightbox openen: ref resetten naar het huidige `frameIndex`, `playing` blijft `filmMode` volgen zoals nu.
4. Geen wijzigingen aan de tile-`FrameAnimation` (die loopt al goed), aan i18n, of aan andere schermen.

## Verificatie
- Open een klaar-oefening in de lightbox, druk op ▶: crossfade heen-en-weer moet minstens 5 volledige loops draaien zonder haperen bij Langzaam/Normaal/Snel.
- Klik op ⏸: stopt onmiddellijk op huidig frame.
- Klik pijltje: springt naar frame, blijft gepauzeerd tot je weer ▶ drukt.
