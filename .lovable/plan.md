# Admin opsplitsen: Edit-pagina + aparte Vormgeving-pagina

## Wat je nu ziet
- `/admin/branding` bestaat niet meer in de app; die pagina is al verwijderd. Het regeltje in de lijst bovenaan het Lovable-voorbeeldvenster is een oude opgeslagen URL van de preview-balk, geen pagina in je app — daarom geeft hij een fout. Ik voeg een nette afvanging toe zodat oude adminlinks netjes doorsturen naar `/admin/edit` in plaats van te crashen.
- De dubbeltik-editor vond bij jouw test "geen aanpasbare kleur" omdat hij alleen kleuren herkent die exact op een token lijken. Dat wordt verbeterd (zie hieronder).

## Twee losse onderdelen onder Beheer
Beide bereikbaar vanaf de bestaande **Edit pagina** (`/admin/edit`); daar komen bovenaan twee duidelijke tegels.

1. **Edit pagina** (`/admin/edit`) — blijft wat hij is: App-modus (Edit / Klantweergave) en Weergavemodus (Premium / Gratis), plus navigatietegels naar Vormgeving en Oefening-afbeeldingen.
2. **Vormgeving** (nieuw, `/admin/vormgeving`) — alles over uiterlijk:
   - Hoofdkleur ALYVA + logo-, header-, knop- en accentkleur
   - Categoriekleuren (Eten, Vasten, Fitness, Gewicht, Calorieën)
   - Interface-kleuren (achtergrond, kaart, tekst, randen)
   - Lettertype en tekstgrootte
   - Elke instelling met kleurvakje, hexcode en korte "Waarvoor:"-uitleg
   - Live voorbeeld bovenaan
   - Concept-werkwijze: direct zichtbaar, pas definitief na **Opslaan**; **Annuleren** zet terug; weggaan met open wijzigingen vraagt bevestiging; **Standaardwaarden herstellen** zet terug naar de ALYVA-basis.

Naam wordt **Vormgeving**, omdat Edit gaat over hoe jij de app bekijkt en Vormgeving over hoe de app eruitziet voor iedereen.

## Dubbeltik / rechtermuisknop in de app zelf
Blijft bestaan én wordt beter — dezelfde bewerking als op de Vormgeving-pagina, maar direct op het element:
- Dubbeltik of rechtsklik op een element → kader eromheen + paneel.
- In het paneel: **kleurkiezers** voor tekstkleur, achtergrondkleur en randkleur van dat element, plus lettertype en tekstgrootte.
- Herkent de kleur nu ook als hij niet exact op een token lijkt: hij kiest de dichtstbijzijnde ALYVA-kleurinstelling en laat altijd minstens de hoofdkleur, achtergrond en tekstkleur zien, zodat je nooit meer "geen aanpasbare kleur" krijgt.
- **Zelfde opslaan-werkwijze**: wijziging is meteen live te zien als concept; onderin blijft de balk "Niet-opgeslagen wijzigingen" staan met **Annuleren** en **Opslaan**. Zonder opslaan blijft er niets bewaard, en weggaan vraagt bevestiging.
- Wat je via dubbeltik wijzigt en opslaat, staat daarna ook op de Vormgeving-pagina — het is één en dezelfde set instellingen.
- Aan/uit-schakelaar voor deze bewerkmodus staat op de Vormgeving-pagina, zodat hij niet in de weg zit tijdens gewoon testen.

## Technisch
- Nieuw bestand `src/routes/_authenticated/admin.vormgeving.tsx` met de token-editor op basis van `src/lib/design-tokens.ts`, hergebruik van draft/save-state uit `src/lib/visual-editor.tsx`.
- `admin.edit.tsx`: hint-kaart vervangen door navigatietegels.
- `visual-editor-layer.tsx`: tokenmatching verruimen (grotere afstandsdrempel + altijd fallback-tokens), activatie via aparte schakelaar in plaats van alleen Edit-modus.
- Redirectroute voor `/admin/branding` → `/admin/edit`.
- Nieuwe teksten in alle 6 talen in `src/lib/i18n.tsx`; overgebleven `admin.branding.*` sleutels opschonen.
