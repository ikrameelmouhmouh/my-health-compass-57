## Doel
Een dev/test-schakelaar in **Instellingen** waarmee jij zelf bepaalt of de app je behandelt als Vita Plus (alles ontgrendeld) of als gratis gebruiker (paywalls zichtbaar). Zo kun je beide ervaringen snel testen zonder daadwerkelijk te betalen of te downgraden.

## Hoe het werkt voor jou
- In **Profiel → Instellingen** komt onder het "Plan"-kaartje een nieuw blokje **"Weergavemodus (test)"** met drie opties:
  1. **Automatisch** — gebruikt je echte abonnementsstatus (standaard).
  2. **Forceer Plus** — alles ontgrendeld, geen paywalls, ook al ben je gratis.
  3. **Forceer Gratis** — laat de paywall-overlays zien zoals een gratis gebruiker ze ziet.
- De keuze wordt lokaal bewaard (localStorage), dus blijft staan na refresh, en is alleen voor jouw apparaat.
- Wanneer een override actief is verschijnt er een klein, subtiel chipje bovenaan ("Testmodus: Plus" / "Testmodus: Gratis") zodat je nooit vergeet dat je niet de echte status ziet — met één tik schakel je terug naar Automatisch.

## Technische uitvoering
1. **Nieuwe hook `src/hooks/use-premium.ts`**
   - Centraliseert de huidige logica (`!!sub && ["active","trialing","past_due"].includes(sub.status) && …`).
   - Leest een override uit `localStorage` (`vita.premiumOverride` = `"auto" | "on" | "off"`).
   - Retourneert `{ isPremium, override, setOverride, realIsPremium }`.
   - Subscribe op `storage` events zodat alle pagina's tegelijk updaten.

2. **`src/routes/_authenticated/settings.tsx`**
   - Vervang lokale `isPremium`-berekening door de hook.
   - Voeg nieuw kaartje "Weergavemodus (test)" toe met drie segment-knoppen (Automatisch / Plus / Gratis), in dezelfde stijl als bestaande kaarten.

3. **`src/routes/_authenticated/profile.tsx`** en **`src/routes/_authenticated/fitness.tsx`**
   - Vervang lokale `isPremium`-berekening door de hook. Verder geen gedragswijziging — de bestaande paywall-routing blijft werken.

4. **Subtiel testmodus-chipje**
   - Klein component `src/components/test-mode-badge.tsx`, gemount in `__root.tsx` (alleen zichtbaar als override ≠ `"auto"`), positie `fixed bottom-4 right-4`, `text-xs`, klikbaar → zet override terug naar `auto`.

5. **i18n**
   - Nieuwe keys in alle 6 talen: `set.testmode.title`, `set.testmode.desc`, `set.testmode.auto`, `set.testmode.force_plus`, `set.testmode.force_free`, `testmode.badge_plus`, `testmode.badge_free`.

## Wat niet verandert
- Geen aanpassingen aan Stripe, backend, of echte abonnementsstatus.
- Paywall-overlays en pricing-flow blijven exact zoals ze zijn.
