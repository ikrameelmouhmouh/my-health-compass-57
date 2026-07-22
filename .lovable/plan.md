## Plan: van 2 frames naar een mini-filmpje

De twee gegenereerde frames (start + eindpositie) kunnen inderdaad als een kort oefenfilmpje aanvoelen. Er zijn twee niveaus waarop we dat kunnen realiseren:

### Optie A — Filmpje in de admin UI (snel, geen backend wijzigingen)
In de adminlijst en in de lightbox voegen we een "play / film"-stand toe.
- Frame 0 en frame 1 worden in een loop afgespeeld met een korte crossfade (bijv. 600 ms) ertussen.
- De gebruiker kan kiezen tussen stil afbeeldingen bekijken of de loop spelen.
- In de lijst kunnen de thumbnails automatisch animeren bij hover, of pas na tikken.
- In de lightbox is er een play/pause-knop en eventueel een snelheidskeuze (langzaam / normaal / snel).
- Technisch: CSS keyframes of een `<img>`-wissel met `opacity`-overgang in React. Geen nieuwe bestanden nodig.

### Optie B — Echte MP4/WebM-video genereren (overal in de app bruikbaar)
We maken van de 2 frames een kort videobestand met ffmpeg.
- Per oefening ontstaat een klein MP4/WebM (2-4 seconden, loopbaar).
- Dit videobestand wordt opgeslagen in de `exercise-frames` bucket onder een naam als `{id}.mp4`.
- Er komt een proxyroute `/api/exercise-frame-video/:id` net als voor de afbeeldingen.
- Het video’tje kan daarna overal worden gebruikt: admin, workout-start, oefening-detail, etc.
- Nadeel: generatie kost meer tijd per oefening en vraagt een ffmpeg-stap in de serverfunctie.

### Mijn advies
Begin met **Optie A**: de crossfade-preview in de adminpagina. Dat geeft meteen het filmpje-gevoel zonder dat we alle ~500 oefeningen opnieuw hoeven te renderen. Daarna kunnen we **Optie B** toevoegen als de preview goed aanvoelt en we de video’s ook in de rest van de app willen gebruiken.

### Vragen aan jou
1. Wil je het filmpje eerst alleen in de admin zien, of gelijk ook in de rest van de app (workout-schermen, oefening-detail)?
2. Vind je een crossfade tussen de 2 huidige frames goed genoeg, of wil je dat de AI daadwerkelijk meer tussengelegen frames genereert zodat de beweging vloeiender is?

Laat maar weten welke scope je wil, dan pas ik het plan aan en begin ik met de implementatie.