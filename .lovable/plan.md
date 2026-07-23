## Fixes op /admin/exercise-frames

1. **Textarea in "Waarom keur je dit af?"-dialog past niet in de kaart**  
   De `<Textarea>` steekt rechts uit de dialog (zie screenshot 2). Oorzaak: waarschijnlijk een vaste breedte of ontbrekende `w-full` / verkeerde padding op de container. Fix: de textarea `w-full` + `box-border` maken en de dialog-content de juiste horizontale padding geven zodat het veld netjes binnen de kaart blijft.

2. **"Reset alles" en "Speel film" weghalen uit de top-toolbar**  
   In `src/routes/_authenticated/admin.exercise-frames.tsx` de knoppen `Reset alles` en `Speel film` uit de bovenste actiebalk verwijderen. "Reset zichtbaar" en "Alles resterend" blijven staan. (De film-functie blijft beschikbaar via de lightbox per oefening.)

---

## Fase 2 — feedback & bespreking (geen wijzigingen)

Wat ik zou aanraden voor het nieuwe home-scherm ("Vandaag"), gebaseerd op wat de app nu heeft en wat concurrenten (Bevel, Whoop, Oura, MyFitnessPal) goed doen:

**A. Wat werkt nu al goed op je home**
- Duidelijke bottom-nav (Start / Eten / Vasten / Workouts / Voortgang).
- Snelle actie-tegels.
- Coach-notitie geeft context.

**B. Wat zwak is nu**
- De home voelt als een dashboard-lijstje, niet als een "vandaag"-verhaal. Je moet zelf betekenis geven aan de cijfers.
- Geen duidelijk **"single number that matters today"** (Whoop = recovery %, Oura = readiness, Bevel = daily score).
- Vasten/workout/eten leven los van elkaar — geen samenhang.
- Geen prominente "wat is de volgende actie?" (bv. workout van vandaag klikbaar bovenaan).

**C. Voorstel voor Fase 2 (3 opties, kies één richting)**

**Optie 1 — Whoop-stijl: "Alyva Score vandaag"**  
Groot rond scherm met één samengestelde score (0–100) gebouwd uit: workout gedaan, calorieën binnen doel, vasten gehaald, gewicht getrend, slaap (later). Eronder 3–4 mini-ringen (workout / eten / vasten / gewicht). Klikbaar → detail. Voelt premium, motiverend, "vandaag heb ik X gescoord".

**Optie 2 — Bevel-stijl: "Vandaag-verhaal"**  
Verticale tijdlijn: 07:00 vasten-status → 12:00 lunch geregistreerd → 17:00 workout van vandaag (grote klikbare kaart) → 21:00 vasten start. Rustig, lineair, weinig cijfers, veel "wat komt er nu". Beste voor mensen die overweldigd raken door data.

**Optie 3 — Hybride: Hero + Rings + Volgende actie**  
Bovenaan: begroeting + één belangrijke metric (bv. streak of vasten-timer als actief). Daaronder: 3 rings (Eten / Beweging / Vasten). Daaronder: **grote kaart "Nu doen"** met de eerstvolgende geplande actie (workout van vandaag, of "start je vasten"). Dan pas de rest van de tegels. Dit combineert overzicht + actie zonder de app om te gooien.

**Mijn aanbeveling: Optie 3 (Hybride).**  
- Minste risico dat we werkende UX slopen.
- Voegt de twee dingen toe die nu ontbreken: één "score/moment" bovenaan én een duidelijke "volgende actie".
- Past bij je huidige lichte iOS-stijl (geen groene forest-mislukking meer).

**D. Extra polish-ideeën (optioneel binnen fase 2)**
- **Weersintegratie** bij "vandaag" — beïnvloedt aanbeveling (binnen/buiten trainen).
- **Streak-badge** naast de begroeting ("🔥 12 dagen vasten gehaald").
- **Empty states** met karakter — bv. als er geen workout gepland is: "Rustdag — je lichaam herstelt. Zin in een korte wandeling?"
- **Pull-to-refresh** met haptic feedback.
- **Dark mode** vandaag-scherm (jij hebt aangegeven dat je licht wilt, maar 's avonds is dark fijn).

**E. Wat ik NIET zou doen in fase 2**
- Home volstoppen met grafieken → daarvoor is "Voortgang".
- Nog een theme-switch — de iOS-stijl blijft.
- Complexe personalisatie/widgets die de gebruiker moet configureren.

---

Zeg maar wat je van deze richtingen vindt, of we combineren stukken uit meerdere opties. Ik pas de plan aan zodra je akkoord geeft, en fix ondertussen de 2 kleine dingen bovenaan.