# Emoji-iconen op de Eten-kaarten + Nederlandse voedingsdatabase

## 1. Emoji-iconen terug bij Ontbijt / Lunch / Diner / Snack

De line-art iconen op de maaltijdkaarten worden vervangen door dezelfde emoji's als in het keuzemenu:
- Ontbijt: 🥣
- Lunch: 🥗
- Diner: 🍽️
- Snack: 🍎

De emoji staat in dezelfde lichtgroene ronde cirkel, de kaartstijl, titel, ondertitel en ronde plus-knop blijven ongewijzigd.

## 2. Voedingsdatabase in het Nederlands

De zoekresultaten komen uit de wereldwijde voedingsdatabase (Open Food Facts) en tonen nu vaak Engelse of Franse productnamen, ook als de app op Nederlands staat.

Verbeteringen:
- Bij Nederlands eerst de Nederlandse/Belgische index bevragen en die resultaten bovenaan tonen.
- De Nederlandse productnaam gebruiken wanneer die beschikbaar is; anders merk + generieke naam.
- Resultaten rangschikken: producten met een Nederlandse naam eerst.
- Producten zonder bruikbare naam of zonder voedingswaarden wegfilteren.
- Barcode-scan volgt dezelfde regels.

Let op: Open Food Facts is een open database; niet elk product heeft een Nederlandse vertaling. Voor die producten blijft de originele naam staan, met merk erbij zodat het herkenbaar blijft.

## Technisch
- `src/routes/_authenticated/nutrition.tsx`: `MEAL_ICONS` in de maaltijdkaarten vervangen door de emoji uit `MEAL_TYPES` (`src/lib/food.ts`), gerenderd in de bestaande groene cirkel.
- `src/components/nutrition/meal-icons.tsx`: maaltijd-iconen worden niet meer gebruikt op de Eten-kaarten; overige iconen (scan, planner, tip) blijven.
- `src/lib/food.ts`: in `searchFoods` de landindex prioriteren, sorteren op aanwezigheid van `product_name_nl`, naamloze/lege producten filteren; `lookupBarcode` dezelfde naamvoorkeur geven.
- Geen wijzigingen in logica van loggen, macro's of vertalingen.
