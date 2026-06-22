Probleem
--------
1. De onboarding-content is niet scrollbaar op mobiel. Bij stappen met veel opties (bv. activiteitsniveau) valt de "Volgende"-knop onder de viewport en kan de gebruiker er niet bij komen.
2. De gebruiker wil bij keuze-stappen (geslacht, doel, tempo, activiteit) niet op een aparte "Volgende"-knop hoeven drukken. Eén klik op de gewenste optie moet direct naar de volgende stap springen.

Oplossing
----------
1. Scrollbaar maken  
   - Wikkel de stap-content in een container met `flex-1 overflow-y-auto` zodat lange stappen kunnen scrollen terwijl de header en knopbalk op hun plek blijven.

2. Auto-advance bij option-stappen  
   - Stap 0 (Gender): roep `next()` aan in `onChange` van `StepGender`.
   - Stap 5 (Doel): roep `next()` aan in `onChange` van `StepGoal`.
   - Stap 6 (Tempo): roep `next()` aan in `onChange` van `StepPace`.
   - Stap 7 (Activiteit): roep `next()` aan in `onChange` van `StepActivity`.

3. KNOP-behavior per stap  
   - Option-stappen (0, 5, 6, 7): verberg de "Volgende / Doorgaan"-knop volledig. De gebruiker selecteert een optie en gaat automatisch door.
   - Invoer-stappen (1, 2, 3, 4, 8 — leeftijd, lengte, gewicht, doelgewicht, trainingsfrequentie): houd de knop. Bij deze stappen typt de gebruiker een waarde en bevestigt met Enter of via de knop.
   - Laatste stap (8): knop toont "Afronden" en blijft bestaan.

4. Animatie / timing  
   - Optionele korte vertraging (150 ms) na selectie zodat de checkmark zichtbaar is voordat de slide animatie start. Dit voorkomt een "gehaast" gevoel.

5. Vertalingen  
   - Geen nieuwe strings nodig; bestaande `onb.continue` / `onb.finish` blijven voor de invoer-stappen.

Wijzigingen beperkt tot `src/routes/_authenticated/onboarding.tsx`.