# Oude maaltijd-iconen terug + Nederlandse voedingsdatabase

## 1. Iconen terugzetten (Ontbijt / Lunch / Diner / Snack)

De iconen worden teruggezet naar de vorige versie:
- Ontbijt: kom met dampstreepjes (blijft gelijk)
- Lunch: rond bord (twee cirkels) met blaadje
- Diner: rond bord met mes en vork ernaast
- Snack: appel (blijft gelijk)

Alleen de tekening verandert; de groene ronde achtergrond, kaartstijl en plus-knop blijven zoals ze nu zijn.

## 2. Voedingsdatabase in het Nederlands

Nu worden zoekresultaten uit de wereldwijde voedingsdatabase (Open Food Facts) gehaald en komen productnamen vaak in het Engels of Frans terug, ook als de app op Nederlands staat.

Verbeteringen:
- Bij Nederlands eerst de Nederlandse/Belgische index bevragen en die resultaten bovenaan tonen.
- Voorkeur voor de Nederlandse productnaam wanneer die bestaat; anders de merknaam + generieke naam.
- Resultaten sorteren: producten met een Nederlandse naam eerst, daarna de rest, zodat de lijst overwegend Nederlands oogt.
- Producten zonder bruikbare naam of zonder voedingswaarden worden weggefilterd, zodat er minder rommel in de lijst staat.
- Hetzelfde geldt voor barcode-scan: Nederlandse naam als die beschikbaar is.

Let op: Open Food Facts is een open database; niet elk product heeft een Nederlandse vertaling. Voor die producten blijft de originele naam staan (met merk erbij, zodat het herkenbaar is).

## Technisch
- `src/components/nutrition/meal-icons.tsx`: `SaladPlateIcon` en `CutleryPlateIcon` terugzetten naar de vorige SVG-paden (commit 355c530).
- `src/lib/food.ts`: in `searchFoods` de landindex prioriteren, resultaten rangschikken op aanwezigheid van `product_name_nl`, lege/naamloze producten filteren; `preferLocale` ook toepassen op `lookupBarcode`-resultaat (gebeurt deels al) en merknaam als fallback in de weergavenaam.
- Geen wijzigingen in logica van loggen, macro's of i18n-strings.
