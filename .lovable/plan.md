## Probleem

Twee dingen mis in de huidige twee frames van Wide Leg Press:

1. **Geen beweging** — in beide frames staan de benen vrijwel in dezelfde gebogen positie, dus het "filmpje" (crossfade tussen frame 1 en 2) lijkt stil te staan.
2. **Short klopt niet** — de zwarte short in frame 2 is langer/anders van vorm dan in frame 1, waardoor het in de loop lijkt of de kleding verandert.

Oorzaak van 2: frame 2 is bijgewerkt met een losse image-edit waarbij de short opnieuw is getekend in plaats van exact overgenomen.

## Aanpak (alleen Wide Leg Press)

**1. Frame 1 blijft ongewijzigd** — dat is de goedgekeurde startpositie (benen gebogen, knieën ~90°, short kort en zwart, rode quads/glutes/hamstrings).

**2. Frame 2 opnieuw genereren als image-edit van frame 1**, met één expliciete instructie-set:
- Identiek: kamer, vloer, licht, camerahoek/afstand, machine (frame, rails, voetplaat, handgrepen, rugleuning), mannequin-proporties, grijze huid.
- Identiek: de **korte** zwarte short — zelfde lengte, zelfde zoomlijn hoog op het bovenbeen, zelfde vorm als frame 1.
- Identiek: rode/oranje spiermarkering op quads (primair, fel rood) en glutes/hamstrings (secundair, zachter oranje-rood), op dezelfde plekken.
- Enige verandering: **benen gestrekt** — de eindpositie van de leg press. Voeten blijven op de voetplaat, de slede/rugleuning schuift weg van de voetplaat zoals mechanisch klopt, knieën bijna volledig gestrekt (niet doorgedrukt), heupen/rug blijven tegen de leuning.

**3. Controle in twee stappen**
- Beide frames naast elkaar visueel checken: zelfde short-lengte, zelfde camerahoek, duidelijk verschil in kniehoek.
- Pas als beide punten kloppen wordt frame 2 opgeslagen; anders opnieuw met bijgestelde instructie (max een paar pogingen).

**4. Cache verversen** zodat je in de Edit workout pagina direct de nieuwe versie ziet in plaats van de oude uit de cache.

## Buiten scope
- Geen andere oefeningen, geen wijziging aan de generator-prompt, geen UI-wijzigingen.
