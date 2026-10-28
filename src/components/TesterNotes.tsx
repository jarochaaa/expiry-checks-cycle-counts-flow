import { LOCS, LOC_BY_ID, PRODUCTS, batchTotal, productLocs } from '../data';
import { allDone } from '../state';
import type { State } from '../state';

const sum = (n: number[]) => n.reduce((a, b) => a + b, 0);

/** How to recreate the edge cases on purpose (for the facilitator). */
const EDGE_CASES: { title: string; steps: string[] }[] = [
  {
    title: 'Force an extra batch (expiry date not listed)',
    steps: ['Open any product (tap the scan icon).', 'Tap “Add batches”, pick a date that is not in the list in the calendar and Apply.', 'Type the units for that new date. The total now includes a third date.', 'To remove an added batch, slide its card to the left and tap the dark red area (only added batches can be deleted).'],
  },
  {
    title: 'Force a recount (Stock Discrepancy)',
    steps: ['Count a product with a total different from its expected units (e.g. Sita: 6 + 3 = 9 instead of 10).', 'Confirm. The product goes back to Recount: pills on its cards, a banner on the list and every location restarts from 0.', 'Count it again with the right numbers (or wrong ones) to finish the recount.'],
  },
  {
    title: 'Out of Stock on a location',
    steps: ['On the list, slide a card to the left and tap the red area (or swipe all the way).', 'On Chao Tuoi, marking location 2 Out of Stock also triggers a Recount, because the total no longer matches 24.'],
  },
  {
    title: 'Same product in several locations',
    steps: ['Chao Tuoi is listed twice from the start: a22-154-112 and a22-155-114 (Product on Multiple Locations).', 'Each location is counted on its own; the expected total is split: location 1 + location 2 = 24 units.'],
  },
  {
    title: 'Errors you cannot trigger by tapping',
    steps: ['Scan failed (no connection), wrong product scanned and send/complete failures: use the “Edge cases” group in the left panel.'],
  },
];

/** Desktop-only side box: what to do on the current screen and which numbers to type (a hint for the facilitator). */
export function TesterNotes({ s, code }: { s: State; code: string }) {
  let title = 'Tester notes';
  const lines: string[] = [];
  let match: { date: string; qty: number }[] | null = null;

  if (s.pdp) {
    const loc = LOC_BY_ID[s.pdp.loc];
    const p = PRODUCTS[loc.product];
    const all = productLocs(loc.product);
    const idx = all.indexOf(loc.id) + 1;
    title = p.name;
    lines.push(`Expected total: ${p.expected} units${all.length > 1 ? ` across ${all.length} locations` : ''}.`);
    lines.push(`This location (${loc.code}) has ${loc.dates.length} expiry date${loc.dates.length > 1 ? 's' : ''}: ${loc.dates.join(', ')}.`);
    if (all.length > 1) {
      const others = all.filter((l) => l !== loc.id).map((l) => `${LOC_BY_ID[l].code} (location ${LOC_BY_ID[l].num})`);
      lines.push(`Location ${idx} of ${all.length}. Other location: ${others.join(', ')}${all.some((l) => LOC_BY_ID[l].unlockedBy) ? ', created after the first one is counted' : ''}.`);
      const counted = all.filter((l) => l !== loc.id && s.locs[l].done).reduce((n, l) => n + s.locs[l].count, 0);
      if (counted) lines.push(`Already counted elsewhere: ${counted}. This location needs ${p.expected - counted} to match.`);
    }
    match = loc.dates.map((date, i) => ({ date, qty: loc.pass[i] }));
    lines.push(`Those quantities add up to ${sum(loc.pass)} units at this location.`);
    if (idx === all.length) {
      const others = all.filter((l) => l !== loc.id).reduce((n, l) => n + s.locs[l].count, 0);
      lines.push(`To see a Stock Discrepancy: type a total other than ${p.expected - others}, then Confirm.`);
    }
    lines.push(`Typed so far: ${batchTotal(s.pdp.batches)}. “Add batches” adds an expiry date that is not listed.`);
    if (s.recount[loc.product]) lines.unshift('RECOUNT: all locations of this product start again from 0.');
  } else if (s.screen === 'audits') {
    title = 'Cycle Counts';
    lines.push('In progress and To do are empty on purpose: tasks only appear here after you send them from Inventory Management (IM): Create Count Task → Expiry Checks (type) → Expiry Sample (strategy) → Create.');
    lines.push('Each task lands first in To do with the same ID as in IM and contains only its own SKUs.');
    lines.push('Removal Tasks is a view only.');
  } else if (s.screen === 'skus') {
    title = 'Product list';
    lines.push('Products: ' + Object.values(PRODUCTS).map((p) => `${p.name} (${p.expected})`).join(' · ') + '.');
    lines.push('Tap the scan icon on a card: it simulates a successful scan and opens the product page.');
    lines.push('Slide a card to the left to mark it Out of Stock.');
    if (LOCS.some((l) => l.unlockedBy && !s.unlocked[l.id])) lines.push('Chao Tuoi’s second location appears after its first location is counted.');
    if (allDone(s)) lines.push('Everything is checked: Complete is enabled.');
  } else if (s.screen === 'language') {
    title = 'Language';
    lines.push('Opened from the ? icon on Cycle Counts (A1). English is the default; Spanish and Arabic (RTL) are available.');
    lines.push('Picking one applies it and returns to Cycle Counts. The EN / ES / AR buttons in the left panel switch it anywhere.');
    lines.push('The orange task banner and this box stay in English.');
  } else if (s.screen === 'summary') {
    title = 'Summary';
    lines.push('“Got it!” or the back arrow restarts the prototype.');
  }

  return (
    <aside className="tester-notes" aria-label="Tester notes">
      <div className="tester-notes__tag">Facilitator hints · view {code}</div>
      <h2>{title}</h2>
      {match && (
        <div className="expect">
          <p className="expect__title">Type these quantities to match</p>
          {match.map((m) => (
            <div key={m.date} className="expect__row">
              <span className="expect__date">{m.date}</span>
              <span className="expect__qty">{m.qty}</span>
            </div>
          ))}
        </div>
      )}
      <ul>
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <details className="edge" open={!!s.pdp || s.screen === 'skus'}>
        <summary>Edge cases · how to recreate them</summary>
        {EDGE_CASES.map((e) => (
          <div key={e.title} className="edge__case">
            <h3>{e.title}</h3>
            <ol>
              {e.steps.map((st, i) => (
                <li key={i}>{st}</li>
              ))}
            </ol>
          </div>
        ))}
      </details>
    </aside>
  );
}
