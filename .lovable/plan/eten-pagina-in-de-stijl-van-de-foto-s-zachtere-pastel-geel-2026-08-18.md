# Eten-pagina in de stijl van de foto's + zachtere pastel-geel

Doel: de Eten-pagina volgt exact de look van foto 1, de app krijgt meer pastel, en de hoofdkleur blijft ALYVA-groen. Alleen de gele macro-kleur wordt aangepast (foto 2 vind je nu te fel/vaal).

## Wat er verandert

### 1. Maaltijdkaarten (Ontbijt / Lunch / Diner / Snack)
- Zelfde kaartstijl als de foto: witte kaart, zachte rand, ruime hoogte.
- Elk icoon in een lichtgroene ronde cirkel met dun line-art icoon in donkergroen:
  - Ontbijt: kom met muesli/blaadjes
  - Lunch: saladekom
  - Diner: dampend bord
  - Snack: appel
- Rechts een ronde plus-knop in lichtgroene cirkel, zoals op de foto.
- Ondertitel blijft "0 kcal · 0 items".

### 2. Tip van de dag
- Kaart met zeer lichte groene achtergrond (geen rand-accent), zoals op de foto.
- Ronde lichtgroene cirkel met vlam-icoon links.
- Bovenaan "TIP VAN DE DAG" in groen hoofdletters, daaronder een vette titel en de tiptekst.
- Rechts een chevron (aanwijzing dat de tip aanklikbaar is).

### 3. Snelacties
- "Scan maaltijd" krijgt een pastelblauwe kaart met blauw camera-icoon in een blauwe cirkel.
- "Maaltijdplanner" krijgt een pastelpaarse kaart met paars kalender-icoon in een paarse cirkel.
- Beide met titel + korte ondertitel ("Foto → macro's" / "Plan je week").

### 4. Pastelkleuren app-breed
- De accentkleuren (blauw, paars, oranje, geel, roze) worden een tandje zachter/pasteliger, met behoud van leesbaar contrast voor tekst en iconen.
- ALYVA-groen blijft de hoofdkleur: navigatie, calorie-ring, voortgangsbalken en primaire knoppen blijven groen.

### 5. Pastel-geel (vetten) opnieuw afstemmen
- Het huidige geel oogt te grijs/flets. Nieuwe waarde: een warmer, zachter boter-geel dat duidelijk geel leest naast de perzik van eiwitten, met een iets diepere tint voor het icoon zodat het niet wegvalt op wit.
- Zowel licht- als donkermodus worden bijgewerkt.

## Technisch
- `src/styles.css`: tokens `--acc-fat`, `--acc-fat-soft` bijstellen (warmer geel, hogere chroma, iets lager lightness voor het icoon) plus lichte pastelbijstelling van `--acc-fitness/-water/-fasting/-weight/-cycle` in `:root` en `.dark`. Groene tokens (`--brand`, `--acc-nutrition`) blijven ongewijzigd.
- `src/components/nutrition/meal-icons.tsx`: iconen aanscherpen zodat ze 1-op-1 matchen met de foto (muesli-kom, saladekom, dampend bord, appel, camera i.p.v. scan-frame, kalender).
- `src/routes/_authenticated/nutrition.tsx`: `MealSection`-kaart, tipkaart en de twee snelactiekaarten herstijlen (blauw/paars tints via bestaande `tint-*` utilities).
- Geen wijziging in logica, data of vertalingen (bestaande i18n-keys blijven gebruikt).
