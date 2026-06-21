Ik zie waar het misgaat: er bestaan al losse onderdelen voor workoutvragen, templates en “workout vandaag”, maar ze zijn niet goed aan elkaar gekoppeld. De chat maakt nu alleen tekst; de knop “Toevoegen aan Workouts” zet hooguit templates in de workout-tab, maar plant niets automatisch voor vandaag en start niet met de vragenflow.

Plan:

1. “Maak workoutplan” laat eerst vragen stellen
- De quick action in de AI Coach moet niet meteen een volledig plan genereren.
- Hij opent/gebruikt de bestaande workout-wizard met vragen zoals doel, dagen, locatie, ervaring, focus, blessures/voorkeuren.
- De prompt in de chat wordt aangepast zodat Vita eerst aanvullende vragen stelt als informatie ontbreekt.

2. “Voeg workout toe” maakt echte templates
- De knop onder een AI-workout blijft zichtbaar bij workout-antwoorden.
- Bij klikken worden de oefeningen omgezet naar workout-templates.
- Daarna krijgt de gebruiker de keuze: bestaande templates vervangen, erbij zetten, of overslaan.

3. Geplande dag koppelen aan Startscherm
- Als een template/AI-plan een dag heeft die overeenkomt met vandaag, wordt die workout automatisch zichtbaar in “Workout vandaag”.
- De Startkaart toont dan de naam, focus/type en duur in plaats van “Geen workout gepland vandaag”.
- Markeren als gedaan blijft werken op het Startscherm.

4. Dag-format fixen
- Ik maak één gedeelde dag-normalisatie voor Monday/Tuesday en mon/tue/nederlandse labels, zodat templates uit AI, wizard en editor hetzelfde worden herkend.
- Dit voorkomt dat een workout niet op vandaag verschijnt omdat de dag anders opgeslagen is.

5. Vertalingen bijwerken
- Nieuwe/gewijzigde UI-teksten voeg ik direct toe voor alle 6 talen: en, nl, ar, fr, de, es.

Technisch:
- Aanpassen: `src/components/chat/chat-screen.tsx`, `src/lib/workout-prefs.ts`, `src/lib/dashboard-prefs.ts`, `src/routes/_authenticated/fitness.tsx`, `src/routes/_authenticated/profile.tsx`, mogelijk `src/lib/i18n.tsx`.
- Geen databasewijziging nodig; dit blijft aansluiten op de bestaande lokale workout/template-opslag.