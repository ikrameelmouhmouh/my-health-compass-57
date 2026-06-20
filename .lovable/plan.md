
## Doel
Vasten verdient een prominente plek in de bottom nav omdat het een kernfunctie is. Social is minder centraal en kan samengevoegd worden met Vooruitgang als tabs binnen één scherm.

## Nieuwe navigatiestructuur (5 tabs)

```text
[ Home ] [ Eten ] [ Workouts ] [ Vasten ] [ Voortgang ]
```

- **Vasten** krijgt eigen tab → directe toegang tot `/fasting` (timer, protocol, geschiedenis).
- **Voortgang** wordt een scherm met tabs bovenaan: `Statistieken | Social`.
- Social-route blijft bestaan voor deeplinks, maar primaire toegang loopt via Voortgang-tab.

## Wijzigingen

### 1. `src/components/bottom-nav.tsx`
- Verwijder Social-item.
- Voeg Vasten-item toe (icoon: `Timer`, route: `/fasting`).
- Volgorde: Home, Eten, Workouts, Vasten, Voortgang.

### 2. `src/routes/_authenticated/progress.tsx`
- Voeg een Tabs-component bovenaan toe: "Statistieken" (huidige inhoud) en "Social".
- Social-tab rendert de bestaande Social-feed component (extraheren uit `social.tsx` indien nodig, of via dynamische import).

### 3. `src/routes/_authenticated/social.tsx`
- Blijft bestaan voor backwards-compatibiliteit / deeplinks.
- Optioneel: bovenaan een hint "Social is nu onderdeel van Voortgang" met link.

### 4. `src/routes/_authenticated/nutrition.tsx`
- De Fasting-kaart die vorige beurt is toegevoegd: **behouden** als snelle toegang vanuit Eten (logisch want vasten = eetvenster). Geen wijziging.

### 5. `src/routes/_authenticated/profile.tsx` (startscherm)
- Bestaande Fasting-shortcut: behouden of verwijderen? Aanbeveling: **verwijderen** nu Vasten een eigen tab heeft, om duplicatie te voorkomen en het startscherm overzichtelijk te houden.

### 6. `src/lib/i18n.tsx`
- Nieuwe keys: `nav.fasting`, `progress.tabStats`, `progress.tabSocial` in alle 6 talen.

## Overwegingen

- **Voordeel**: Vasten staat altijd één tap weg; consistent met het feit dat het een dagelijkse routine is.
- **Risico Social**: minder zichtbaar. Maar als de app primair fitness/nutrition is en Social secundair, is dat acceptabel.
- **Voortgang + Social combinatie**: beide gaan over "jouw resultaten zien" — Stats toont eigen data, Social toont data van vrienden. Past thematisch.

## Vraag voor jou
Akkoord met:
1. Fasting-shortcut op startscherm verwijderen (om duplicatie te voorkomen)?
2. Social-tabs binnen Voortgang, of zou je Social liever volledig laten verdwijnen uit de hoofdnav (alleen via een knop op het profielscherm)?
