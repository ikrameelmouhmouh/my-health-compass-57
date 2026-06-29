Voeg een duidelijk cijfer toe aan de bovenste Voortgang-kaart dat laat zien hoeveel kilo de gebruiker nog moet afvallen om het doel te halen. Percentage blijft behouden.

Wijzigingen:
1. Bereken `remainingKg = max(0, curW - goal)` in `src/routes/_authenticated/weight.tsx`.
2. Toon dit getal in de hero-kaart, rechts onder of naast het percentage, in dezelfde stijl als de rest van de kaart (klein label + groot cijfer).
3. Voeg vertaalkeys toe voor alle 6 talen in `src/lib/i18n.tsx`:
   - `prog.remaining`: "Remaining" / "Nog te gaan" / "المتبقي" / "Restant" / "Verbleibend" / "Restante"
   - `prog.remainingK`: "{n} kg to go" / "{n} kg te gaan" / etc.
4. Fallback: als er geen doel is ingesteld, toon "—" of "Doel instellen" zoals nu.
5. Huidige progressiebalk en percentage blijven onveranderd.

Bestanden:
- `src/routes/_authenticated/weight.tsx` (UI + berekening)
- `src/lib/i18n.tsx` (vertalingen)