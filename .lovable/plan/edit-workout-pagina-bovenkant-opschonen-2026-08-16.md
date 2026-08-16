# Edit workout pagina — bovenkant opschonen

## Wat ik begrijp
Op `/admin/exercise-frames` wil je alles bovenaan weg hebben behalve de titel en de vier statusfilters. Weg: de groene voortgangsbalk, de knoppen "Genereer volgende 20", "Alles resterend (64)" en "Reset zichtbaar (390)", plus het kleine grijze uitlegtekstje eronder. De rest van de pagina (zoekbalk, lijst met oefeningen, rood/refresh/groen knoppen, lightbox, feedback-popup) blijft exact zoals het nu is.

## Nieuwe bovenkant
```text
[schild] Edit workout pagina
         111 van 508 klaar · 7 slecht

[ Nog te doen 0 ] [ Ter controle 390 ] [ Slecht 7 ] [ Klaar 111 ]

[ Zoek oefening... ]
```

## Makkelijk terugzetten in de toekomst
Ik verwijder de batch-functionaliteit niet uit de code, maar zet hem achter één schakelaar bovenaan het bestand:

```ts
// Zet op true om de batch-generatie tools weer te tonen
const SHOW_BATCH_TOOLS = false;
```

Zo kun jij (of ik) later met één woord de generatieknoppen en de voortgangsbalk terugzetten, zonder dat er code opnieuw geschreven hoeft te worden. Alle onderliggende logica (`runBatch`, `resetJobs`) blijft intact.

## Technisch
- Bestand: `src/routes/_authenticated/admin.exercise-frames.tsx`
- Regels 217–249 (voortgangsbalk, knoppenrij, `reset_hint`-tekst) worden gewrapt in `{SHOW_BATCH_TOOLS ? (...) : null}`.
- Filmsnelheid-regeling en statusfilters blijven ongewijzigd.
- Geen wijzigingen aan API-routes, database of afbeeldingen; er wordt niets gegenereerd of gereset.
