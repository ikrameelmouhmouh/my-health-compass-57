# Programmakaart vereenvoudigen

De kaart onder Vandaag toont nu onder de plannaam een extra regel met splitnaam, doel en dagen per week. Die regel gaat weg.

## Wat er verandert

1. **Alleen de naam**
   - De regel "Lower/Upper/Core & Cardio Split · Lose Weight · Dagen/wk: 5" verdwijnt volledig.
   - De kaart toont alleen de plannaam (bijv. "Vetverbranding & Onderlichaam Focus Plan"), de knop om opnieuw te genereren en het voortgangsbalkje.

2. **Eigen schema**
   - Wanneer er geen AI-plan is maar wel eigen trainingen, verschijnt dezelfde kaart met de titel "Eigen trainingsschema".
   - Die versie heeft geen regenerate-knop; het voortgangsbalkje toont de voltooide trainingen van de afgelopen 7 dagen uit de bestaande workoutgeschiedenis, afgezet tegen het aantal eigen trainingen met een dag.
   - Zijn er geen eigen trainingen met een dag, dan blijft de kaart weg (zoals nu).

3. **Taal**
   - "Eigen trainingsschema" wordt als nieuwe tekstsleutel toegevoegd in alle 6 talen.

## Technisch

- `src/routes/_authenticated/fitness.tsx`: subregel in de programmakaart verwijderen; de kaart als klein herbruikbaar blok gebruiken en ook renderen in de tak zonder opgeslagen plan (met titel uit de nieuwe i18n-sleutel).
- Voortgang voor het eigen schema uit de bestaande sessiegeschiedenis in `src/lib/workout-session.ts`; geen nieuwe data of opslag.
- `src/lib/i18n.tsx`: sleutel `fit.own_program` toevoegen (en/nl/ar/fr/de/es).
- Verder niets buiten Fitness aanpassen.
