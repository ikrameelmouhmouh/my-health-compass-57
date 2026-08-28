# Vormgeving als aan/uit-knop op de Edit-pagina

## Wat je krijgt
Geen aparte instellingenpagina met lange lijsten. Op de bestaande **Edit pagina** (`/admin/edit`) komt één extra blok met een schakelaar, net als App-modus en Weergavemodus:

**Vormgeving-modus: Aan | Uit**

- **Uit** (standaard): de app werkt gewoon normaal, dubbeltikken doet niets.
- **Aan**: je kunt door de hele app lopen en op elk element **rechtsklikken of dubbeltikken** om het aan te passen.

## Wat er gebeurt bij dubbeltik/rechtsklik
Een kader om het element + een klein paneel onderin met:
- Kleurkiezers voor de kleuren die op dat element gebruikt worden (tekst, achtergrond, rand) met hexcode ernaast
- Lettertype en tekstgrootte
- Sluiten-knop

De kleurherkenning wordt verbeterd, zodat je niet meer "Geen aanpasbare kleur gevonden" krijgt: hij pakt de dichtstbijzijnde ALYVA-kleurinstelling en toont altijd minstens hoofdkleur, achtergrond en tekstkleur als terugval.

## Opslaan
- Wijzigingen zie je meteen live, maar ze zijn een **concept**.
- Onderin blijft de balk staan: "Niet-opgeslagen wijzigingen" met **Annuleren** en **Opslaan**.
- Pas na Opslaan is het definitief voor de hele app; Annuleren zet alles terug.
- Wegklikken naar een andere pagina met open wijzigingen → bevestiging.
- In het paneel blijft **Standaardwaarden herstellen** staan om terug te gaan naar de ALYVA-basiskleuren.

## Admin branding weg
`/admin/branding` bestaat al niet meer als pagina; het regeltje dat je in de lijst ziet is een oude opgeslagen URL van de Lovable-previewbalk. Ik voeg een doorstuur toe zodat die oude link netjes naar `/admin/edit` gaat in plaats van een fout te geven, en ruim de overgebleven branding-teksten op.

## Technisch
- `src/hooks/use-app-mode.ts`-stijl hook erbij: `use-design-mode.ts` met eigen localStorage-sleutel (`alyva.design_mode`, standaard uit).
- `admin.edit.tsx`: derde kaart met Aan/Uit-schakelaar + korte uitleg; hint-kaart vervangen.
- `visual-editor-layer.tsx`: activatie op `isAdmin && designMode === "on"` in plaats van Edit-modus; tokenmatching verruimen met fallback-tokens.
- Nieuwe route `src/routes/_authenticated/admin.branding.tsx` die alleen redirect naar `/admin/edit`.
- Nieuwe teksten in alle 6 talen in `src/lib/i18n.tsx`; ongebruikte `admin.branding.*` sleutels opschonen.
