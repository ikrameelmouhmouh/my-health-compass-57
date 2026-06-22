We gaan de workout-ervaring verder aanscherpen. De volgende wijzigingen komen in één keer:

1. **Pauzeknop in de actieve sessie**
   - De lopende timer kan worden gepauzeerd/hervat via een duidelijke knop in de sticky header.
   - Gepauzeerde tijd telt niet mee voor de eindduur; we slaan `pausedAt` en `totalPausedSec` op in de sessie.
   - Tijdens pauze kan de gebruiker wel sets afvinken/bewerken (geen harde blokkade).

2. **Rusttimer tussen sets**
   - Bij het afvinken van een set verschijnt een optionele rusttimer (bijv. 30-180s).
   - De timer is inklapbaar; hij loopt op de achtergrond door zolang de sessie actief is.
   - Bij 0 seconden: korte trilling + optioneel piepje.
   - Standaard rusttijd per oefening onthouden we in de sessie, niet in het template.

3. **Geluid en vibratie**
   - Rusttimer-afloop: 1 korte piep via Web Audio API.
   - Pauze knop bij pauzeren: zachte trilling (als toestel ondersteunt).
   - Geen extra npm-pakketten; we gebruiken native browser-API's.

4. **"Vorige keer"-hint per set (verfijning)**
   - Onder elke niet-afgevinkte set tonen we: "Vorige keer: 35 kg x 10".
   - De hint verdwijnt zodra de set is gedaan.
   - Voor nieuwe oefeningen tonen we een lichte tip in plaats van een streepje.

5. **Persoonlijke records (PR's) bij afronden**
   - In de afrond-schermen markeren we sets met een PR-badge wanneer gewicht x herhalingen hoger is dan eerder opgeslagen.
   - We slaan PR's per oefening op in localStorage (`fitness.prs.v1`) zodat ze in latere sessies blijven bestaan.
   - Op termijn kunnen we hier een PR-overzicht/grafiek van maken; nu tonen we de trofee alleen in het afrond-scherm.

6. **Oefeningnotities (RPE)**
   - Per oefening een inklapbaar notitieveld en een RPE-slider (1-10).
   - Wordt opgeslagen in de sessiegeschiedenis, handig voor terugblik.

7. **Meertaligheid**
   - Alle nieuwe strings (pauze, rusttimer, PR, RPE, etc.) worden direct vertaald voor de 6 talen in `src/lib/i18n.tsx`.

**Technische details**
- Aanpassingen in `src/lib/workout-session.ts` voor pauze-logica, PR-opslag en RPE.
- Aanpassingen in `src/routes/_authenticated/workout-session.$templateId.tsx` voor pauzeknop, rusttimer, geluid/vibratie en hints.
- Aanpassingen in `src/components/workout/session-summary.tsx` voor PR-trofeeën en RPE-tonen.
- Geen backend- of npm-wijzigingen nodig.

**Uit scope voor nu (bespaar later):**
- Supersets koppelen
- Apple Health-koppeling
- Plaatcalculator
- Volledig PR-grafiekoverzicht