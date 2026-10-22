# Pelican · Cycle Count (prototype)

Clickable, mobile-first prototype of the "Cycle Count in Pelican with Multiple Locations" flow (Picker counting SKUs across several locations), built from the Pelican DMarts Figma Master (canvas "Expiry Checks + Cycle Counts").

- Tap task **40543** → **Start** → tap a card's scan icon (a tap is a simulated successful scan) → tap the field, type the units → **Add item**.
- Slide a card left to mark it **Out of Stock**.
- A product whose units don't match the system total goes back to **Recount** (all its locations).
- On desktop (≥1100px) the top-left "Cycle Count · flow" panel jumps straight to any state.
- On a phone: *iPhone → Share → Add to Home Screen; Android → Install app* to run it without browser UI.

```bash
npm install
npm run dev
npm run deploy   # builds and publishes dist/ to the gh-pages branch
```
