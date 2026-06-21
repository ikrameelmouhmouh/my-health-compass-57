## Doel
De drie featured workouts op het Workouts-scherm krijgen nieuwe, anatomisch correcte afbeeldingen, zodat ze er meteen professioneel uitzien.

## Wat er mis is
- **Leg Press (`wide-leg-press-0.jpg`)**: voeten raken het voetplaatform niet — drukken "tegen niks aan".
- **Shoulder Press (`overhead-press-0.jpg`)**: gewichten ontbreken op de stang.
- **Deadlift (`deadlift-0.jpg`)**: niet realistisch / klopt niet.

## Aanpak
Ik genereer 3 nieuwe afbeeldingen met `imagegen` (premium tier voor anatomische precisie) en vervang de bestaande bestanden op dezelfde paden — geen code-wijzigingen nodig, alle imports blijven werken.

Bestanden die vervangen worden:
- `src/assets/exercises/wide-leg-press-0.jpg` — atleet zit in 45° leg press machine, beide voeten **stevig plat op het voetplaatform**, knieën in lijn met tenen, gewichtsplaten zichtbaar op de slede.
- `src/assets/exercises/overhead-press-0.jpg` — staande barbell overhead press, **duidelijke gewichtsplaten aan beide kanten** van de stang, stang net boven het hoofd.
- `src/assets/exercises/deadlift-0.jpg` — barbell deadlift vanaf de vloer, correcte vorm: rechte rug, heupen scharnierend, gewichtsplaten op de stang, stang dicht tegen scheenbenen.

Stijl blijft consistent met de andere featured plaatjes (zelfde gym-sfeer / belichting / framing).

## Vraag voor jou
Wil je dat ik ook de `-1.jpg` varianten (tweede afbeelding per oefening) vervang, of alleen de `-0.jpg` die als preview op het Workouts-scherm verschijnt?
