## Doel

Op de Edit workout pagina (`/admin/exercise-frames`) wil je opnieuw alles handmatig doorlopen. Dus: standaardweergave weer op **Alle**, en het mapje **Klaar** leeg — terwijl álle bestaande frames/afbeeldingen precies blijven zoals ze nu zijn.

## Wat er gebeurt

1. **Standaardfilter terug naar "Alle"**
   De pagina opent weer op het tabje "Alle" in plaats van "Nog te doen". De aantallen-badges per mapje blijven staan.

2. **Goedkeuringen wissen (status reset)**
   Alle oefeningen die nu op `done` (Klaar) staan, worden teruggezet naar `pending`. Daardoor is het mapje "Klaar" leeg en staat alles weer in je werklijst om opnieuw te beoordelen. Eerder gegeven afkeur-notities blijven bewaard.

3. **Afbeeldingen blijven ongemoeid**
   Er wordt niets opnieuw gegenereerd, niets verwijderd en niets overschreven in de frame-opslag. Alleen de goedkeur-status verandert.

4. **Lightbox-gedrag**
   Het groene vinkje blijft werken zoals nu (goedkeuren en doorschuiven naar de volgende), maar omdat je op "Alle" staat verdwijnt een goedgekeurde oefening niet meteen uit de lijst — je kunt gewoon door de hele set heen lopen. Wil je later weer alleen het openstaande werk zien, dan klik je zelf op "Nog te doen".

## Technisch

- `src/routes/_authenticated/admin.exercise-frames.tsx`: initiële `filter`-state van `"pending"` naar `"all"`.
- Eenmalige database-update op `exercise_frame_jobs`: `status = 'pending'` waar `status = 'done'` (geen wijziging aan storage-bestanden of `updated_at`-frames).
