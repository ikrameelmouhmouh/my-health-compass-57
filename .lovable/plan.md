## Wat er misgaat

**1. Filmpje in lightbox stopt na 1 tick**

In `Lightbox` (src/routes/_authenticated/admin.exercise-frames.tsx, regel 439-441) staat:

```ts
useEffect(() => {
  if (value) setPlaying(filmMode);
}, [value, filmMode]);
```

De loop-interval roept elke tick `onChange({ exerciseId, frameIndex: next })` aan. Dat verandert het `value`-object in de parent, waardoor deze effect opnieuw draait en `playing` terug op `filmMode` (meestal `false`) zet. Resultaat: na één crossfade valt `playing` weer op `false` en stopt de loop. Precies wat je nu ziet.

**2. Wide Leg Press (en andere goedgekeurde plaatjes) komen "oud" terug**

De plaatjes zelf worden wél permanent bewaard in Lovable Cloud storage — die verdwijnen niet als je Lovable sluit. Het probleem zit in de image-proxy `src/routes/api/exercise-frame.$id.$i.ts`:

```
Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400
```

Dat betekent: browser cachet 1 dag, de CDN edge tot 7 dagen. Omdat een nieuwe generatie hetzelfde bestandspad (`<id>-0.jpg`) overschrijft, blijft de CDN de oude bytes serveren totdat die 7 dagen om zijn of de cache wordt gepurged. Jij zag dus na sluiten/openen nog steeds de oude, afgekeurde versie — niet omdat de nieuwe plaatjes weg zijn, maar omdat de CDN de oude nog voorschotelt.

## Wat ik ga aanpassen

Alleen in `src/routes/_authenticated/admin.exercise-frames.tsx` en `src/routes/api/exercise-frame.$id.$i.ts` — geen andere schermen, geen data-migraties.

### A. Loop repareren (lightbox)

- De effect die `playing` synchroniseert met `filmMode` alleen laten reageren op oefening-wissel of `filmMode`-toggle, niet op elke frame-tick. Dependency wordt `[value?.exerciseId, filmMode]` in plaats van `[value, filmMode]`.
- Loop-effect blijft zoals ie is (deps `[playing, filmSpeed, value?.exerciseId]`, via `currentFrameRef`) — dat deel is al goed.
- Resultaat: ▶ blijft oneindig heen-en-weer loopen tot ⏸, pijltje of sluiten.

### B. CDN-cache stoppen met oude bytes serveren

Twee kleine wijzigingen:

1. In de proxy (`api/exercise-frame.$id.$i.ts`) de `Cache-Control` kort maken en `ETag` op basis van de storage-versie zetten, zodat na een nieuwe generatie binnen enkele seconden de nieuwe bytes verschijnen:
   ```
   Cache-Control: public, max-age=60, s-maxage=60, must-revalidate
   ```
   Ook `updated_at` van het storage-object als `Last-Modified` / `ETag` teruggeven.

2. In de admin-UI de image-URLs een versie-parameter meegeven na een succesvolle (re)generatie, zodat browsers direct de nieuwe versie ophalen zonder handmatig hard-refreshen: `?v=<job.updated_at ms>`. De bestaande `getExerciseFrameUrl(...)` helper wordt lokaal in dit scherm uitgebreid met een `?v=` suffix uit `job.updated_at`. Andere plekken die deze helper gebruiken blijven ongewijzigd.

### C. Antwoord op "moet ik iets opslaan?"

Nee — er is geen "save"-knop nodig. Zodra generatie klaar is (status `done` in `exercise_frame_jobs`) staan de bytes permanent in Lovable Cloud storage en blijven ze staan tot jij ze expliciet reset of opnieuw genereert. Sluiten/heropenen van Lovable of de app raakt daar niets aan. Het "terugvallen" dat je zag was puur CDN-cache; met fix B is dat weg.

## Verificatie

- Open Edit workout pagina → lightbox → ▶: crossfade moet minstens 10 loops draaien op Langzaam/Normaal/Snel zonder te stoppen. ⏸ stopt op huidig frame; pijltje pauzeert en springt.
- Voor Wide Leg Press: opnieuw genereren, direct daarna herladen. Nieuwe frames moeten binnen ~1 min zichtbaar zijn (dankzij `?v=` cache-bust: direct).
- Andere schermen die frames tonen (bibliotheek etc.) blijven werken.
