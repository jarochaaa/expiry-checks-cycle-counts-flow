import { useEffect, useRef, useState } from 'react';
import type { Dispatch } from 'react';
import { LOC_BY_ID, PRODUCTS, batchTotal, fmtDate } from '../data';
import type { Pdp as PdpState } from '../state';
import type { Action } from '../state';
import { icons } from '../components/icons';
import { cx } from '../components/ui';
import { SwipeOOS } from '../components/SwipeOOS';
import { useI18n } from '../i18n';

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
  const { t } = useI18n();
  const sheet = pdp.sheet as Extract<PdpState['sheet'], { kind: 'qty' }>;
  const loc = LOC_BY_ID[pdp.loc];
  const ref = useRef<HTMLInputElement>(null);
  const inset = useKeyboardInset(true);
  // The sheet stays open while it moves on to the next expiry date: only that swap is animated
  const first = useRef(sheet.date);
  const advanced = first.current !== sheet.date;
  useEffect(() => {
    ref.current?.focus();
  }, [sheet.date]);
  return (
    <div className="p-overlay pl" style={{ paddingBottom: inset }} onClick={() => dispatch({ type: 'sheetCancel' })}>
      <div className="qsheet" role="dialog" aria-label="Quantity" onClick={(e) => e.stopPropagation()}>
        <div className={advanced ? 'qsheet__slide qsheet__slide--next' : 'qsheet__slide'} key={sheet.date}>
        <div className="loc-tag"><bdi>{loc.code}</bdi></div>
        <p className="qsheet__label">{t('countAll')}</p>
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
          aria-label={t('quantity')}
          value={sheet.value}
          onChange={(e) => dispatch({ type: 'qtyType', value: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && dispatch({ type: 'qtyDone' })}
        />
        </div>
        <button type="button" className="p-btn" onClick={() => dispatch({ type: 'qtyDone' })}>
          {t('done')}
        </button>
      </div>
    </div>
  );
}


function Calendar({ sheet, dispatch }: { sheet: Extract<PdpState['sheet'], { kind: 'calendar' }>; dispatch: Dispatch<Action> }) {
  const { t } = useI18n();
  const WEEK = t('weekdays').split(',');
  const locale = t('locale');
  const { viewY, viewM, y, m, d } = sheet;
  const first = new Date(viewY, viewM, 1).getDay();
  const days = new Date(viewY, viewM + 1, 0).getDate();
  const month = new Date(viewY, viewM, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const headline = new Date(y, m, d).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div className="p-overlay p-overlay--center pl" onClick={() => dispatch({ type: 'sheetCancel' })}>
      <div className="cal" role="dialog" aria-label={t('countAll')} onClick={(e) => e.stopPropagation()}>
        <div className="cal__head">
          <div>
            <p className="cal__q">{t('calQuestion')}</p>
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
            <button type="button" aria-label={t('prevMonth')} onClick={() => dispatch({ type: 'calMonth', delta: -1 })}>
              <img src={icons.calPrev} alt="" />
            </button>
            <button type="button" aria-label={t('nextMonth')} onClick={() => dispatch({ type: 'calMonth', delta: 1 })}>
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
            {t('apply')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Product page of a location: count the units for each expiry date (batch), add batches, confirm. */
export function PdpScreen({ pdp, recount, hintClosed, dispatch }: { pdp: PdpState; recount: boolean; hintClosed: boolean; dispatch: Dispatch<Action> }) {
  const { t, rich } = useI18n();
  const loc = LOC_BY_ID[pdp.loc];
  const product = PRODUCTS[loc.product];
  const total = batchTotal(pdp.batches);
  const [slid, setSlid] = useState<string | null>(null); // added batch whose delete area is open

  // After typing a quantity, bring the next empty batch card into view.
  const prev = useRef<{ kind?: string; date?: string; isNew?: boolean }>({});
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const was = prev.current;
    prev.current = pdp.sheet?.kind === 'qty' ? { kind: 'qty', date: pdp.sheet.date, isNew: pdp.sheet.isNew } : {};
    if (was.kind === 'qty' && !pdp.sheet && !was.isNew) {
      const i = pdp.batches.findIndex((b) => b.date === was.date);
      const next = pdp.batches.slice(i + 1).find((b) => b.qty === 0);
      if (next) scroller.current?.querySelector(`[data-date="${next.date}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [pdp.sheet, pdp.batches]);

  return (
    <div className="pdp pl">
      <div className="pdp__scroll" ref={scroller}>
        <div className="pdp__image">
          <button type="button" className="pdp__back" aria-label={t('back')} onClick={() => dispatch({ type: 'pdpBack' })}>
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
              <p>{rich('discrepancyPdp')}</p>
            </div>
          )}
          {!hintClosed && !pdp.banner && (
            <div className="hint" role="note">
              <img src={icons.infoCircle} alt="" />
              <div className="hint__text">
                <strong>{t('hintTitle')}</strong>
                <span>{t('hintBody')}</span>
              </div>
              <button type="button" className="hint__close" aria-label={t('close')} onClick={() => dispatch({ type: 'closeHint' })}>
                <img src={icons.xWhite} alt="" />
              </button>
            </div>
          )}
          <div className="pdp__first">
            <div className="loc-tag"><bdi>{loc.code}</bdi></div>
            {recount && <span className="recount-tag">{t('recount')}</span>}
          </div>
          {pdp.batches.map((b) => {
            const card = (
              <section data-date={b.date} className="batch">
                <div className="batch__title">
                  <span>{t('countAll')}</span>
                  <span className="ptag">{b.date}</span>
                </div>
                <div className="batch__line" />
                <div className="batch__qty">
                  <span>{t('quantity')}</span>
                  <button type="button" className="qty-field" aria-label={`${t('quantity')} ${b.date}`} onClick={() => dispatch({ type: 'openQty', date: b.date })}>
                    {b.qty}
                  </button>
                </div>
              </section>
            );
            // Batches added by the picker (not in the system's list) slide left to be deleted
            if (loc.dates.includes(b.date)) return <div key={b.date}>{card}</div>;
            return (
              <div key={b.date} data-date-wrap={b.date}>
                <SwipeOOS kind="delete" open={slid === b.date} onOpen={() => setSlid(b.date)} onClose={() => setSlid(null)} onOOS={() => (setSlid(null), dispatch({ type: 'deleteBatch', date: b.date }))}>
                  {card}
                </SwipeOOS>
              </div>
            );
          })}
        </div>
      </div>
      <div className="pdp__ctas">
        <button type="button" className="p-btn p-btn--outline" onClick={() => dispatch({ type: 'openCalendar' })}>
          {t('addBatches')}
        </button>
        <button type="button" className="p-btn" disabled={total === 0} onClick={() => dispatch({ type: 'confirm' })}>
          {t('confirm')}
        </button>
      </div>

      {pdp.sheet?.kind === 'qty' && <QtySheet pdp={pdp} dispatch={dispatch} />}
      {pdp.sheet?.kind === 'calendar' && <Calendar sheet={pdp.sheet} dispatch={dispatch} />}
    </div>
  );
}
