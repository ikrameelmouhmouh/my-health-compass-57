## Plan: oefenframes resetten en opnieuw goed opbouwen

We resetten niet de hele app, maar wel het systeem voor oefen-afbeeldingen zodat het vanaf nu consistenter werkt als een korte 2-frame oefenfilm.

### 1. Oude/betrouwbare status opschonen
- Alle bestaande `exercise_frame_jobs` terugzetten naar een schone staat, of minimaal alle `bad`, `pending` en verkeerd gegenereerde jobs resetten.
- Oude frame-bestanden overschrijven bij nieuwe generatie, zodat je geen mix krijgt van oude en nieuwe stijl.
- De adminpagina duidelijk laten tonen of een oefening `nieuw`, `bezig`, `klaar`, `slecht` of `fout` is.

### 2. Eén vaste visuele stijl afdwingen
- Alle oefeningen krijgen dezelfde studio:
  - witte/off-white ruimte
  - zelfde vloer en achtergrond
  - zelfde licht
  - zelfde genderneutrale 3D-mannequin
- Beide frames moeten eruitzien alsof ze uit dezelfde camera-opname komen.
- Frame 2 mag alleen de houding veranderen, niet de camera, ruimte, machine of het poppetje.

### 3. Machine-oefeningen apart behandelen
Voor oefeningen zoals leg press, chest press, lat pulldown, leg extension en cable row gebruik ik geen algemene prompt meer.

Daarvoor maak ik vaste regels per machine-type:
- welke kant de camera op kijkt
- hoe het lichaam ligt/zit/staat
- waar het apparaat zichtbaar moet blijven
- wat de startpositie is
- wat de eindpositie is

Voorbeeld Wide Leg Press:
- vaste 3/4-zijaanzicht camera
- volledige leg press machine blijft zichtbaar
- mannequin blijft op dezelfde stoel/rugleuning
- voeten blijven op dezelfde voetplaat
- alleen knieën/heuphoek verandert tussen frame 1 en frame 2

### 4. Vrije gewicht/bodyweight-oefeningen eenvoudiger houden
Voor squats, push-ups, pull-ups, curls, planks enzovoort gebruiken we vaste categorie-regels:
- squat/deadlift: zijaanzicht
- pull-up/pulldown: vooraanzicht
- row: schuin zijaanzicht
- curl/raise: vooraanzicht of 3/4-aanzicht
- plank/core: zijaanzicht

### 5. Generatie veiliger maken
- Eerst frame 1 genereren als duidelijke startpositie.
- Daarna frame 2 genereren met frame 1 als referentie.
- Als frame 2 toch machine/camera/mannequin verandert, krijgt de job een duidelijke foutstatus in plaats van stil mislukken.
- De adminpagina krijgt een betere “opnieuw genereren” flow voor individuele oefeningen.

### 6. Testen met probleemgevallen
Ik test eerst met een kleine set voordat alles opnieuw wordt gegenereerd:
- Wide Leg Press
- Seated Cable Row
- Lat Pulldown
- Chest Press
- Leg Extension
- Pull-up
- Squat

Pas als deze goed genoeg zijn, kun je daarna de rest batchgewijs opnieuw laten genereren.

### Technisch
- Bestaande camera-hints uitbreiden en strenger maken.
- De generatie-API aanpassen zodat machine-hints leidend zijn.
- Adminpagina aanpassen om reset/regenerate betrouwbaarder te maken.
- Database/statussen opschonen via een gecontroleerde backend-migratie of admin-resetactie.

### Belangrijk
Dit geeft nog steeds geen 100% garantie dat AI-afbeeldingen altijd perfect zijn, maar het maakt de kans op consistente 2-frame oefenfilmpjes veel groter dan de huidige losse generatie-aanpak.