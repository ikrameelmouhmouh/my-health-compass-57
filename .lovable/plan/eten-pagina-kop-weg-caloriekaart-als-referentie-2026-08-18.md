# Eten-pagina: kop weg + caloriekaart als referentie

## 1. Titel weghalen
De grote kop "Eten" boven de datumnavigatie verdwijnt. Het logo blijft bovenaan, daaronder direct de datumbalk met pijltjes en kalender.

## 2. Caloriekaart 1-op-1 als de referentieafbeelding
Nieuwe opbouw binnen dezelfde rustige witte kaart met afgeronde hoeken:

Links:
- Kleine grijze regel "Je kunt nog"
- Groot getal + "kcal eten"
- Groene horizontale voortgangsbalk (gegeten t.o.v. doel)
- "0 kcal gegeten" in groen

Rechts:
- Grote halfronde (gauge) calorie-ring, lichtgroene baan met donkerder groene voortgang
- Groen vlam-icoon in een zacht groen rondje
- Ernaast: "Doel" + doelwaarde + "kcal"

Daaronder, gescheiden door een dunne lijn, drie macro-kolommen in plaats van de huidige ringblokken:
- Koolhydraten — groen icoon in groen rondje
- Eiwitten — oranje icoon in oranje rondje (in plaats van paars uit de referentie)
- Vetten — geel/amber icoon in geel rondje

Elke kolom toont "0 / 140 g" (waarde groen/vet, doel grijs) met daaronder een dun voortgangsbalkje in de eigen macro-kleur.

Geen paars, blauw of roze in deze kaart — die blijven voor Vasten, Fitness en Inzichten.

## Technische details
- Alleen `src/routes/_authenticated/nutrition.tsx` wordt herbouwd voor dit kaartgedeelte; logica (totalen, doelen, maaltijden, paywall) blijft ongewijzigd.
- Eiwit-token `--acc-protein` in `src/styles.css` wordt van perzik naar duidelijk oranje bijgesteld (licht + donker thema); vet blijft zachtgeel, koolhydraten gebruiken het bestaande ALYVA-groen.
- Nieuwe/aangepaste teksten ("Je kunt nog", "kcal eten", "kcal gegeten", volledige macronamen Koolhydraten/Eiwitten/Vetten) worden in alle 6 talen toegevoegd in `src/lib/i18n.tsx`.
- Gauge wordt een SVG-boog (ca. 240°) met `stroke-linecap: round`, geen extra dependency.
