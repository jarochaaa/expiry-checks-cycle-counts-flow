import { useEffect, useRef, useState } from 'react';
import type { Dispatch } from 'react';
import { LOC_BY_ID, PRODUCTS, batchTotal, fmtDate } from '../data';
import type { Pdp as PdpState } from '../state';
import type { Action } from '../state';
import { icons } from '../components/icons';
import { cx } from '../components/ui';

/** Height the on-screen keyboard takes from the bottom of the visual viewport (0 where the layout already resizes). */
function useKeyboardInset(active: boolean) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      setInset(0);
    };
  }, [active]);
  return inset;
}

function QtySheet({ pdp, dispatch }: { pdp: PdpState; dispatch: Dispatch<Action> }) {
  const sheet = pdp.sheet as Extract<PdpState['sheet'], { kind: 'qty' }>;
  const loc = LOC_BY_ID[pdp.loc];
  const ref = useRef<HTMLInputElement>(null);
  const inset = useKeyboardInset(true);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="p-overlay pl" style={{ paddingBottom: inset }} onClick={() => dispatch({ type: 'sheetCancel' })}>
      <div className="qsheet" role="dialog" aria-label="Quantity" onClick={(e) => e.stopPropagation()}>
        <div className="loc-tag">{loc.code}</div>
        <p className="qsheet__label">Count all items with Expiry Date</p>
        <span className="ptag">{sheet.date}</span>
        <input
          ref={ref}
          className="qsheet__input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          enterKeyHint="done"
          autoComplete="off"
          placeholder="0"
          aria-label="Quantity"
          value={sheet.value}
          onChange={(e) => dispatch({ type: 'qtyType', value: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && dispatch({ type: 'qtyDone' })}
        />
        <button type="button" className="p-btn" onClick={() => dispatch({ type: 'qtyDone' })}>
          Done
        </button>
      </div>
    </div>
  );
}

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function Calendar({ sheet, dispatch }: { sheet: Extract<PdpState['sheet'], { kind: 'calendar' }>; dispatch: Dispatch<Action> }) {
  const { viewY, viewM, y, m, d } = sheet;
  const first = new Date(viewY, viewM, 1).getDay();
  const days = new Date(viewY, viewM + 1, 0).getDate();
  const month = new Date(viewY, viewM, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const headline = new Date(y, m, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div className="p-overlay p-overlay--center pl" onClick={() => dispatch({ type: 'sheetCancel' })}>
      <div className="cal" role="dialog" aria-label="Expiry date" onClick={(e) => e.stopPropagation()}>
        <div className="cal__head">
          <div>
            <p className="cal__q">Which expiry date you want to capture?</p>
            <p className="cal__date">{headline}</p>
          </div>
          <span className="cal__pencil" aria-hidden>
            <img src={icons.pencil} alt="" />
          </span>
        </div>
        <div className="cal__nav">
          <span className="cal__month">
            {month}
            <img src={icons.calCaret} alt="" />
          </span>
          <div className="cal__arrows">
            <button type="button" aria-label="Previous month" onClick={() => dispatch({ type: 'calMonth', delta: -1 })}>
              <img src={icons.calPrev} alt="" />
            </button>
            <button type="button" aria-label="Next month" onClick={() => dispatch({ type: 'calMonth', delta: 1 })}>
              <img src={icons.calNext} alt="" />
            </button>
          </div>
        </div>
        <div className="cal__grid">
          {WEEK.map((w, i) => (
            <span key={i} className="cal__dow">
              {w}
            </span>
          ))}
          {Array.from({ length: first }, (_, i) => (
            <span key={`b${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const selected = viewY === y && viewM === m && day === d;
            return (
              <span key={day} className={cx('cal__day', selected && 'cal__day--sel')}>
                <button type="button" aria-label={fmtDate(viewY, viewM, day)} aria-pressed={selected} onClick={() => dispatch({ type: 'calSelect', y: viewY, m: viewM, d: day })}>
                  {day}
                </button>
              </span>
            );
          })}
        </div>
        <div className="cal__foot">
          <button type="button" className="p-btn" onClick={() => dispatch({ type: 'calApply' })}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/** Product page of a location: count the units for each expiry date (batch), add batches, confirm. */
export function PdpScreen({ pdp, recount, hintClosed, dispatch }: { pdp: PdpState; recount: boolean; hintClosed: boolean; dispatch: Dispatch<Action> }) {
  const loc = LOC_BY_ID[pdp.loc];
  const product = PRODUCTS[loc.product];
  const total = batchTotal(pdp.batches);
  return (
    <div className="pdp pl">
      <div className="pdp__scroll">
        <div className="pdp__image">
          <button type="button" className="pdp__back" aria-label="Back" onClick={() => dispatch({ type: 'pdpBack' })}>
            <img src={icons.pdpBack} alt="" />
          </button>
          <div className="pdp__image-box">
            <img src={product.image} alt="" />
          </div>
        </div>
        <div className="pdp__body">
          <h2 className="pdp__name">{product.name}</h2>
          {pdp.banner && (
            <div className="discrepancy-p" role="status">
              <img src={icons.alertTriangle} alt="" />
              <p>
                <strong>Stock Discrepancy.</strong> Product total units don’t match. Please <strong>recount</strong> all locations for this product, starting with <strong>this one</strong>.
              </p>
            </div>
          )}
          {!hintClosed && !pdp.banner && (
            <div className="hint" role="note">
              <img src={icons.infoCircle} alt="" />
              <div className="hint__text">
                <strong>How to check Expiry Dates</strong>
                <span>Count the total units for each listed Expiry Date within this location. If any expiry dates are missing, please create a new batch for them.</span>
              </div>
              <button type="button" className="hint__close" aria-label="Close hint" onClick={() => dispatch({ type: 'closeHint' })}>
                <img src={icons.xWhite} alt="" />
              </button>
            </div>
          )}
          <div className="pdp__first">
            <div className="loc-tag">{loc.code}</div>
            {recount && <span className="recount-tag">Recount</span>}
          </div>
          {pdp.batches.map((b) => (
            <section key={b.date} className="batch">
              <div className="batch__title">
                <span>Count all items with Expiry Date</span>
                <span className="ptag">{b.date}</span>
              </div>
              <div className="batch__line" />
              <div className="batch__qty">
                <span>Quantity</span>
                <button type="button" className="qty-field" aria-label={`Quantity for ${b.date}`} onClick={() => dispatch({ type: 'openQty', date: b.date })}>
                  {b.qty}
                </button>
              </div>
            </section>
          ))}
        </div>
      </div>
      <div className="pdp__ctas">
        <button type="button" className="p-btn p-btn--outline" onClick={() => dispatch({ type: 'openCalendar' })}>
          Add batches
        </button>
        <button type="button" className="p-btn" disabled={total === 0} onClick={() => dispatch({ type: 'confirm' })}>
          Confirm
        </button>
      </div>

      {pdp.sheet?.kind === 'qty' && <QtySheet pdp={pdp} dispatch={dispatch} />}
      {pdp.sheet?.kind === 'calendar' && <Calendar sheet={pdp.sheet} dispatch={dispatch} />}
    </div>
  );
}
