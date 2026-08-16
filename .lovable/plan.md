Plan: fitnesspagina compacter en bibliotheek direct zichtbaar

Doel
De /fitness-pagina voelt nu te lang omdat de wekelijkse split 7 grote kaarten neemt en de AI Workout Builder een uitgebreide lege-state sectie is. De oefeningenbibliotheek moet direct zichtbaar zijn zonder veel te scrollen.

Wijzigingen

1. Herorden de inhoud van de Dashboard-view op /fitness
   - Header en ViewTabs blijven bovenaan.
   - Daarna direct LibrarySection (Oefeningenbibliotheek).
   - Daarna TemplatesSection (Eigen trainingen).
   - Daarna pas het programma-overzicht en de wekelijkse split.
   - AI Workout Builder komt helemaal onderaan als compacte kaart/knop.

2. Compactere wekelijkse split
   - Verklein de 7 dag-kaarten: minder padding, kleinere typografie, compactere hoogte.
   - Toon alle dagen in een responsief grid of compacte lijst, zodat de hele week in één oogopslag past.
   - Huidige dag blijft visueel geaccentueerd.
   - Details van een dag blijven uitklapbaar, maar nemen niet meer de volle hoogte in dan nodig.

3. Compactere AI Workout Builder
   - Vervang de grote EmptyState-sectie (icoon, titel, bullets, grote knop) door een compacte card van één regel/kaart:
     - Sparkles-icoon + korte tekst + kleinere CTA-knop.
     - Bij niet-premium: compacte “Upgrade” hint in plaats van grote pricing-knop.
   - De bestaande WorkoutWizard-functionaliteit blijft ongewijzigd; alleen de trigger/entrypoint wordt kleiner.

4. Visuele afstemming
   - Gebruik bestaande design tokens (rounded-2xl, border-border, bg-card/50, text-muted-foreground, brand-kleur) zodat de nieuwe indeling consistent blijft met de rest van Alyva.
   - Geen harde kleurwaarden; alleen semantische tokens uit src/styles.css.

Bestanden
- src/routes/_authenticated/fitness.tsx
- eventueel benodigde i18n-vertalingen in src/lib/i18n.tsx (alle 6 talen)

Valideren
- Preview openen op /fitness.
- Controleren dat Oefeningenbibliotheek bovenaan staat zonder scrollen.
- Controleren dat de wekelijkse split compacter is.
- Controleren dat AI Workout Builder onderaan als compacte kaart zichtbaar is.
- Controleren dat openen van de wizard en het synchroniseren van templates nog werkt.
