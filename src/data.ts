import sita from './assets/products/sita.png';
import burine from './assets/products/burine.png';

export type ProductId = 'sita' | 'burine';
export type LocId = 'sita1' | 'sita2' | 'burine';

export interface Product {
  id: ProductId;
  name: string;
  image: string;
  /** How the thumbnail sits inside the 82px white tile (Figma crops, px). */
  thumb: { x: number; y: number; w: number; h: number };
  sku: string;
  barcode: string;
  /** Units the system expects across all locations (a mismatch triggers a Stock Discrepancy). */
  expected: number;
}

export const PRODUCTS: Record<ProductId, Product> = {
  sita: {
    id: 'sita',
    name: 'SitaSpices Ground Cinammon 36 g',
    image: sita,
    thumb: { x: 5.86, y: 7.75, w: 70.29, h: 66.49 },
    sku: '002021042710113',
    barcode: '88725580516',
    expected: 10,
  },
  burine: {
    id: 'burine',
    name: 'Chao Süa Burine Grießbrei Keks',
    image: burine,
    thumb: { x: 7.03, y: 9.97, w: 67.94, h: 64.27 },
    sku: '002021042710131',
    barcode: '88725580530',
    expected: 30,
  },
};

export interface Loc {
  id: LocId;
  product: ProductId;
  code: string;
  /** 1 = primary location (shown first), 2 = secondary */
  num: 1 | 2;
  /** Product has several locations → "Product on Multiple Locations" header */
  multi: boolean;
  /** Only the first Sita location carries a multiple-expiration-date prompt in the design. */
  expiry?: string;
}

/** Route order, as in the SKU list frame. SKUs are listed by LOCATION, not by product. */
export const LOCS: Loc[] = [
  { id: 'sita1', product: 'sita', code: 'a11-131-120', num: 1, multi: true, expiry: '12/12/26' },
  { id: 'sita2', product: 'sita', code: 'a11-132-121', num: 2, multi: true },
  { id: 'burine', product: 'burine', code: 'a22-154-100', num: 1, multi: false },
];

export const LOC_BY_ID = Object.fromEntries(LOCS.map((l) => [l.id, l])) as Record<LocId, Loc>;
export const LOC_ORDER = LOCS.map((l) => l.id);
export const productLocs = (p: ProductId) => LOCS.filter((l) => l.product === p).map((l) => l.id);

export const TASK_DATE = '31/07/2023 - 13:07';
export const TASK_DATE_DONE = '31/07/2023 - 13:09';

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** A batch = one expiry date within a location, counted separately. Dates are DD.MM.YYYY. */
export interface Batch {
  date: string;
  qty: number;
}
export const DEFAULT_DATES = ['12.12.2027', '21.11.2027'];
export const defaultBatches = (): Batch[] => DEFAULT_DATES.map((date) => ({ date, qty: 0 }));
export const fmtDate = (y: number, m: number, d: number) => `${pad2(d)}.${pad2(m + 1)}.${y}`;
export const batchTotal = (b: Batch[]) => b.reduce((n, x) => n + x.qty, 0);

export interface Ticket {
  id: string;
  date: string;
  tag?: string;
  products?: number;
}
export const COUNT_TICKETS: { inProgress: Ticket[]; todo: Ticket[] } = {
  inProgress: [{ id: '67890', date: '25/09/2024 – 13:07', tag: 'Location level' }],
  todo: [
    { id: '67891', date: '25/09/2024 – 13:07', tag: 'Expiry Level' },
    { id: '67892', date: '25/09/2024 – 13:07' },
  ],
};
export const REMOVAL_TICKETS: { inProgress: Ticket[]; todo: Ticket[] } = {
  inProgress: [{ id: '67890', date: '25/09/2024 – 13:07', products: 20 }],
  todo: [
    { id: '67891', date: '25/09/2024 – 13:07', products: 10 },
    { id: '67892', date: '25/09/2024 – 13:07', products: 8 },
  ],
};
