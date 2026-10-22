import type { Dispatch } from 'react';
import { PRODUCTS } from '../data';
import type { ProductId } from '../data';
import type { Action } from '../state';
import { icons } from './icons';

/** Product details, opened by tapping a product image. */
export function DetailModal({ product, dispatch }: { product: ProductId; dispatch: Dispatch<Action> }) {
  const p = PRODUCTS[product];
  return (
    <div className="overlay">
      <div className="detail" role="dialog" aria-label={p.name}>
        <div className="detail__image">
          <img src={p.image} alt="" />
        </div>
        <button type="button" className="detail__close" aria-label="Close" onClick={() => dispatch({ type: 'detail', product: null })}>
          <img src={icons.close} alt="" />
        </button>
        <div className="detail__text">
          <p className="detail__name">{p.name}</p>
          <p className="detail__sku">SKU: {p.sku}</p>
          <p className="detail__barcode">
            Barcode:
            <br />
            {p.barcode}
          </p>
        </div>
      </div>
    </div>
  );
}
