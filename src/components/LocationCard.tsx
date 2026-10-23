import { LOC_BY_ID, PRODUCTS, pad2 } from '../data';
import type { LocId } from '../data';
import type { LocState, Pill } from '../state';
import { icons } from './icons';
import { LocPin, StatusPill, cx } from './ui';

/** One SKU **location** card (the list is by location, not by product). */
export function LocationCard({
  id,
  pill,
  done,
  onScan,
  onImage,
}: {
  id: LocId;
  pill: Pill;
  /** present on the Processed tab */
  done?: LocState;
  onScan?: () => void;
  onImage: () => void;
}) {
  const loc = LOC_BY_ID[id];
  const p = PRODUCTS[loc.product];
  const t = p.thumb;
  const batches = done ? done.batches.filter((b) => b.qty > 0) : [];
  return (
    <article className={cx('card', loc.multi ? 'card--multi' : 'card--single', done && 'card--done')}>
     <div className="card__top">
      <div className="card__scan" />
      <div className="card__info" />
      <div className="card__content">
        <div className="card__row">
          <button type="button" className="thumb" aria-label={`Show ${p.name}`} onClick={onImage}>
            <img src={p.image} alt="" style={{ left: t.x, top: t.y, width: t.w, height: t.h }} />
          </button>
          <div className="card__text">
            <h2 className="card__title">{p.name}</h2>
            <div className={cx('card__pills', !pill && 'card__pills--empty')}>{pill && <StatusPill kind={pill} />}</div>
            <div className="loc">
              <LocPin num={loc.num} />
              {loc.code}
            </div>
          </div>
        </div>
      </div>
      {done ? (
        <div className="card__count">
          <img src={icons.allInbox} alt="" />
          {pad2(done.count)}
        </div>
      ) : (
        <button type="button" className="card__scanbtn" aria-label={`Scan ${p.name} at ${loc.code}`} onClick={onScan}>
          <img src={icons.qrScan} alt="" />
        </button>
      )}
      {loc.multi && (
        <div className="card__header">
          <img src={icons.tripHeader} alt="" />
          Product on Multiple Locations
        </div>
      )}
     </div>
     {batches.length > 0 && (
        <ul className="card__batches" aria-label="Expiry dates">
          {batches.map((b) => (
            <li key={b.date} className="ptag ptag--batch">
              {b.date} · {b.qty}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
