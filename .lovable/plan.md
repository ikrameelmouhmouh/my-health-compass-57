## Wat je wil

Op de Edit workout pagina: zodra je een oefening goedkeurt met het groene vinkje, moet die uit de lijst verdwijnen die je aan het doorwerken bent, en alleen nog te zien zijn onder het mapje "Klaar". Zo blijft de lijst een echte to-do-lijst.

## Huidige situatie (gecheckt)

De filterchips (Alle / Nog te doen / Klaar / Mislukt / Slecht) bestaan al, maar:
- De pagina start standaard op **Alle**, dus goedgekeurde oefeningen blijven gewoon tussen de rest staan.
- De chips laten niet zien hoeveel oefeningen in elk mapje zitten.
- "Nog te doen" laat nu ook "Slecht" gemarkeerde oefeningen zien (dat is eigenlijk wel logisch, want die moet je nog aanpassen) maar dat is nergens duidelijk.

## Wat ik ga doen

1. **Standaardfilter wordt "Nog te doen"** in plaats van "Alle". Bij openen van de pagina zie je dus alleen wat nog aandacht nodig heeft: nooit gegenereerd, mislukt en als "slecht" gemarkeerd. Goedgekeurde oefeningen zijn direct uit het zicht.
2. **Goedkeuren = direct weg uit de lijst.** Als je in de lijst of in de lightbox op het groene vinkje drukt, wordt de status "Klaar" en verdwijnt de rij meteen uit "Nog te doen" (de lijst verschuift dus door naar de volgende oefening die je nog moet checken). Onder de chip "Klaar" blijft hij gewoon terug te vinden, met de mogelijkheid om hem weer af te keuren of opnieuw te genereren.
3. **Aantallen op de chips**, bijv. `Alle 120 · Nog te doen 34 · Klaar 80 · Mislukt 4 · Slecht 2`, zodat je in één blik ziet hoeveel werk er nog ligt.
4. **Pijltjes in de lightbox volgen dezelfde lijst.** Nu je met de standaardfilter door "Nog te doen" loopt, springen de vorige/volgende pijltjes alleen langs oefeningen die nog beoordeeld moeten worden. Na goedkeuren gaat de lightbox automatisch naar de volgende oefening in plaats van te sluiten of leeg te blijven.

## Technisch

- `src/routes/_authenticated/admin.exercise-frames.tsx`:
  - `useState<...>("all")` → `"pending"` als startwaarde van `filter`.
  - Filterlogica van `pending` expliciet maken: alles behalve `status === "done"`.
  - Per-status tellingen (`all/pending/done/failed/bad`) uit `jobsById` berekenen en als badge in de chiplabels renderen.
  - Bij de goedkeur-mutatie (`status: "done"`) de query invalidatie behouden; in de lightbox na goedkeuren doorschuiven naar de volgende `rows`-index (en sluiten als er geen volgende meer is).
- Nieuwe/gewijzigde UI-teksten voor de chiplabels toevoegen in alle 6 talen in `src/lib/i18n.tsx`.

Geen wijzigingen aan de generatielogica, prompts of bestaande frames.