import { useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import { LOC_BY_ID, PRODUCTS } from '../data';
import { pillFor } from '../state';
import type { Action, State } from '../state';
import { icons } from './icons';
import { LocPin, StatusPill, cx } from './ui';

/** SKU modal shown after a (simulated) successful scan: count the units at this location. */
export function ScanModal({ s, dispatch }: { s: State; dispatch: Dispatch<Action> }) {
  const scan = s.scan!;
  const loc = LOC_BY_ID[scan.loc];
  const product = PRODUCTS[loc.product];
  const pill = pillFor(s, loc.id);
  const inputRef = useRef<HTMLInputElement>(null);

  const expiry = loc.expiry && !s.recount[loc.product] ? loc.expiry : null;
  const header = expiry ? 'Product with Multiple Expiration Dates' : loc.multi ? 'Product on Multiple Locations' : null;
  const idle = !scan.focused && !scan.value;
  const ready = scan.value.length > 0;

  // The recount modal opens already focused (it follows a submit); otherwise the tester taps the field.
  useEffect(() => {
    if (scan.focused && document.activeElement !== inputRef.current) inputRef.current?.focus();
  }, [scan.focused, scan.banner]);

  const submit = () => ready && dispatch({ type: 'submit' });

  return (
    <div className={cx('overlay', scan.focused && 'overlay--top')}>
      <div className="modal" role="dialog" aria-label="Count units">
        <div className={cx('modal__image', scan.banner && 'modal__image--small')}>
          <img src={product.image} alt="" />
          <button type="button" className="modal__collapse" aria-label="Close" onClick={() => dispatch({ type: 'closeScan' })}>
            <img src={icons.arrowDown} alt="" />
          </button>
        </div>
        {header && (
          <div className="modal__head">
            {!expiry && <img src={icons.tripHeader} alt="" />}
            {header}
          </div>
        )}
        <div className="modal__body">
          <div className="modal__inner">
            {scan.banner ? (
              <div className="modal-banner">
                <img className="dark-icon" src={icons.alertTriangle} alt="" />
                <p>
                  <strong>Stock Discrepancy.</strong>
                  <br />
                  Product Total Units don’t match. Please <strong>Recount</strong> all locations for this product, starting with{' '}
                  <strong>this one</strong>.
                </p>
              </div>
            ) : (
              <h2 className="modal__title">{product.name}</h2>
            )}
            {expiry ? (
              <div className="modal__expiry">
                <span>
                  Expiry Date: <strong>{expiry}</strong>
                </span>
                <span className="modal__expiry-loc">
                  <LocPin num={loc.num} />
                  {loc.code}
                </span>
              </div>
            ) : (
              <div className="modal__locrow">
                <div className="loc">
                  <LocPin num={loc.num} />
                  {loc.code}
                </div>
                {pill && <StatusPill kind={pill} />}
              </div>
            )}
            <label className={cx('field', idle && 'field--idle')}>
              {!idle && <span className="field__label">Amount of items</span>}
              <input
                ref={inputRef}
                className="field__input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                enterKeyHint="done"
                autoComplete="off"
                placeholder={expiry ? 'Count items based on above expiry date' : 'Amount of items'}
                value={scan.value}
                onFocus={() => !scan.focused && dispatch({ type: 'focus' })}
                onChange={(e) => dispatch({ type: 'type', value: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </label>
            <p className="modal__barcode">{product.sku}</p>
          </div>
          <button type="button" className={cx('btn', ready ? 'btn--primary' : 'btn--off')} disabled={!ready} onClick={submit}>
            Add item
          </button>
        </div>
      </div>
    </div>
  );
}
