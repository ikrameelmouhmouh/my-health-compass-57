# Admin opsplitsen: Edit-pagina + aparte Vormgeving-pagina

## Wat je nu ziet
- `/admin/branding` bestaat niet meer in de app; de pagina is al verwijderd. Het regeltje in de lijst bovenaan het Lovable-voorbeeldvenster is een oude opgeslagen URL van de preview-balk (browsergeschiedenis), geen pagina in je app. Daarom geeft hij een foutmelding als je erop klikt. Ik zorg dat er ook een nette afvanging komt zodat oude links niet crashen.
- De stijl-instellingen zaten verstopt: je moest in Edit-modus dubbeltikken op een element. Dat was niet duidelijk. Er komt nu een echte pagina met knoppen.

## Twee losse onderdelen onder Beheer
1. **Edit-pagina** (`/admin/edit`) — blijft wat hij is: App-modus (Edit / Klantweergave) en Weergavemodus (Premium / Gratis). Bovenaan komt een tegel/knop naar het tweede onderdeel.
2. **Vormgeving** (nieuw, `/admin/vormgeving`) — alles over uiterlijk:
   - Hoofdkleur ALYVA + logo-, header-, knop- en accentkleur
   - Categoriekleuren (Eten, Vasten, Fitness, Gewicht, Calorieën)
   - Interface-kleuren (achtergrond, kaart, tekst, randen)
   - Lettertype en tekstgrootte
   - Elke instelling met een kleurvakje, hexcode en korte "Waarvoor:"-uitleg
   - Live voorbeeld bovenaan
   - **Concept-werkwijze**: wijzigingen zie je meteen, maar pas na **Opslaan** worden ze definitief; **Annuleren** zet alles terug; weggaan met open wijzigingen vraagt bevestiging; **Standaardwaarden herstellen** zet alles terug naar de ALYVA-basiskleuren.

De naam wordt **Vormgeving** (in plaats van "Edit"), omdat Edit gaat over hoe jij de app bekijkt en Vormgeving over hoe de app eruitziet voor iedereen.

## Toegang
- Adminlink verdwijnt uit **Instellingen**.
- In plaats daarvan een klein schild-icoon in de header van de Startpagina, alleen zichtbaar voor jouw adminaccount. Dat opent `/admin/edit`, en daar staan de knoppen naar **Vormgeving** en **Oefening-afbeeldingen**.

## Dubbeltik-editor
De dubbeltik/rechtsklik-editor in de app blijft bestaan als snelle manier, maar is nu optioneel: aan/uit te zetten op de Vormgeving-pagina. Standaard uit, zodat hij je niet meer in de weg zit tijdens gewoon gebruik.

## Technisch
- Nieuw bestand `src/routes/_authenticated/admin.vormgeving.tsx` met de volledige token-editor op basis van `src/lib/design-tokens.ts` en `src/lib/visual-editor.tsx` (draft/save-state hergebruiken).
- `admin.edit.tsx`: hint-kaart vervangen door navigatietegels naar Vormgeving en Oefening-afbeeldingen.
- `settings.tsx`: Beheer-sectie verwijderen; schild-knop toevoegen in de header van `profile.tsx` achter `useIsAdmin()`.
- `visual-editor-layer.tsx`: activatie afhankelijk maken van een aparte schakelaar, niet enkel Edit-modus.
- Nieuwe teksten in alle 6 talen in `src/lib/i18n.tsx`; oude `admin.branding.*` sleutels opschonen.
