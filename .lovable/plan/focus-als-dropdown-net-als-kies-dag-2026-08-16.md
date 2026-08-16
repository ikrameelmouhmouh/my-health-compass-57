# Focus als dropdown (net als "Kies dag")

## Wat er verandert

Het focus-veld in "Nieuwe training" wordt geen zichtbare pillen-grid meer, maar een dropdown die er precies zo uitziet en opent als "Kies dag".

- Gesloten: knop met tekst "Focus kiezen" of de gekozen focus, bijv. "Full body + Benen".
- Open: een uitklaplijst met alle focusgebieden onder elkaar (Full body, Upper body, Lower body, Push, Pull, Benen, Billen, Quads, Hamstrings, Kuiten, Borst, Rug, Schouders, Armen, Biceps, Triceps, Core, Buik, Cardio, Kracht, HIIT, Mobiliteit, Functioneel).
- Je kunt er 2 aanklikken; gekozen items krijgen een vinkje. Bij een derde keuze verschijnt de melding dat er maximaal 2 mogelijk zijn.
- De lijst blijft open tijdens het kiezen, zodat je direct twee opties kunt aanvinken.
- Het losse read-only tekstveld naast de dag verdwijnt; de dropdown neemt die plek in, zodat dag en focus naast elkaar staan zoals nu.

## Technisch

- `src/components/template-editor.tsx`: `FocusPicker` herschrijven als `DropdownMenu` (shadcn) met `DropdownMenuCheckboxItem`, trigger gestyled als de bestaande `SelectTrigger` zodat dag en focus identiek ogen. Het read-only `Input` wordt verwijderd.
- `src/lib/focus-areas.ts` blijft ongewijzigd (opties, `formatFocus`, `parseFocus`).
- i18n: bestaande `wiz.focus.*` en `tpl.focus_max` hergebruiken; alleen een nieuwe placeholder-key toevoegen indien nodig, in alle 6 talen.
- Bestaande opgeslagen focus-waarden blijven werken via `parseFocus`.
