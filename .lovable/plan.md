## Slide 0 opschonen

Op de eerste intro-slide:

1. **Bovenbalk verbergen op slide 0** — de kleine "Alyva · ALIVE · YOU · VITALITY" chip bovenaan (tussen terug-knop en Overslaan) is dubbelop met de grote merkmark. Op slide 0 tonen we alleen de terug-knop en "Overslaan"; het logo-blok in het midden vervalt. Vanaf slide 1 blijft de bovenbalk zoals nu.

2. **Losse "Welkom bij Alyva"-titel/omschrijving weghalen** — het aparte tekstblok onder de A wordt verwijderd.

3. **"Welkom bij Alyva" in het merkthema** — in plaats van het losse woordmerk "ALYVA" tonen we onder de grote A de tekst **"Welkom bij Alyva"** in dezelfde elegante serif-stijl (Cormorant/Playfair, spaced caps-look), met daaronder de tagline `Alive · You · Vitality` zoals nu. Zo blijft één rustig, centraal merkbeeld staan.

4. **i18n** — `intro.s0.title` wordt "Welkom bij Alyva" (en equivalent in en/ar/fr/de/es: "Welcome to Alyva", enz.). `intro.s0.desc` vervalt (niet meer gebruikt op slide 0, key blijft staan voor compat).

## Bestanden
- `src/routes/intro.tsx` — bovenbalk conditioneel verbergen op `step === 0`; brand-slide rendert grote A + "Welkom bij Alyva" in serif + tagline; losse titel/desc onder de illustratie niet renderen voor slide 0.
- `src/lib/i18n.tsx` — `intro.s0.title` bijwerken in alle 6 talen.

## Buiten scope
Overige slides en andere schermen blijven ongewijzigd.
