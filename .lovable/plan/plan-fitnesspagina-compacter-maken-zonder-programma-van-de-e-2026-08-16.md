Plan: fitnesspagina compacter maken zonder programma van de eerste plek te halen

Doel
De /fitness-pagina voelt te lang. De wekelijkse split neemt met 7 grote kaarten te veel ruimte in, waardoor de oefeningenbibliotheek ver naar beneden wordt gedrukt. Het huidige programma blijft het belangrijkst en moet bovenaan blijven staan.

Wijzigingen

1. Huidige programma en wekelijkse split blijven bovenaan
   - De bovenste programma-card (programmanaam, statistieken, voortgang) blijft ongewijzigd op zijn plek.
   - De wekelijkse split blijft direct onder het programma.

2. Compactere wekelijkse split
   - Verklein de 7 dag-kaarten: minder padding, kleinere typografie, compactere hoogte.
   - Toon de dagen in een responsief grid of een compacte lijst, zodat de hele week in veel minder verticale ruimte past.
   - Huidige dag en volgende training blijven visueel geaccentueerd.
   - Details van een dag blijven uitklapbaar, maar nemen niet meer de volle hoogte in dan nodig.
   - Rest-dagen krijgen een lichtere/compactere weergave.

3. Bibliotheek en eigen trainingen direct onder de split
   - LibrarySection (Oefeningenbibliotheek) komt direct onder de wekelijkse split.
   - TemplatesSection (Eigen trainingen) komt daar weer onder.
   - Doel: gebruiker hoeft nauwelijks te scrollen om de bibliotheek te zien.

4. AI Workout Builder compact onderaan
   - Vervang de grote EmptyState-sectie (icoon, titel, bullets, grote knop) door een compacte card:
     - Sparkles-icoon + korte tekst + kleinere CTA-knop.
     - Bij niet-premium: compacte “Upgrade” hint in plaats van grote pricing-knop.
   - De bestaande WorkoutWizard-functionaliteit blijft ongewijzigd; alleen de trigger/entrypoint wordt kleiner.

5. Visuele afstemming
   - Gebruik bestaande design tokens (rounded-2xl, border-border, bg-card/50, text-muted-foreground, brand-kleur) zodat de nieuwe indeling consistent blijft met de rest van Alyva.
   - Geen harde kleurwaarden; alleen semantische tokens uit src/styles.css.

Bestanden
- src/routes/_authenticated/fitness.tsx
- eventueel benodigde i18n-vertalingen in src/lib/i18n.tsx (alle 6 talen)

Valideren
- Preview openen op /fitness.
- Controleren dat het huidige programma bovenaan blijft.
- Controleren dat de wekelijkse split compacter is en minder scrollen nodig is.
- Controleren dat Oefeningenbibliotheek snel zichtbaar is zonder veel te scrollen.
- Controleren dat AI Workout Builder onderaan als compacte kaart zichtbaar is.
- Controleren dat openen van de wizard en het synchroniseren van templates nog werkt.
