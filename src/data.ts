import sita from './assets/products/sita.png';
import salt from './assets/products/salt.png';
import burine from './assets/products/burine.png';
import chao from './assets/products/chao.png';

export type ProductId = 'sita' | 'salt' | 'burine' | 'chao';
export type LocId = 'sita1' | 'sita2' | 'salt1' | 'burine' | 'chao1' | 'chao2' | 'salt2';

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
  salt: {
    id: 'salt',
    name: 'Salt',
    image: salt,
    thumb: { x: 1.17, y: 4.44, w: 80.83, h: 76.46 },
    sku: '002021042710127',
    barcode: '88725580523',
    expected: 22,
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
  chao: {
    id: 'chao',
    name: 'Chao Tuoi Oat Meal',
    image: chao,
    thumb: { x: 2.35, y: 5.55, w: 76.14, h: 72.03 },
    sku: '002021042710145',
    barcode: '88725580547',
    expected: 11,
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
  { id: 'salt1', product: 'salt', code: 'a18-102-190', num: 1, multi: true },
  { id: 'burine', product: 'burine', code: 'a22-154-100', num: 1, multi: false },
  { id: 'chao1', product: 'chao', code: 'a22-154-112', num: 1, multi: true },
  { id: 'chao2', product: 'chao', code: 'a22-155-114', num: 2, multi: true },
  { id: 'salt2', product: 'salt', code: 'a38-132-116', num: 2, multi: true },
];

export const LOC_BY_ID = Object.fromEntries(LOCS.map((l) => [l.id, l])) as Record<LocId, Loc>;
export const LOC_ORDER = LOCS.map((l) => l.id);
export const productLocs = (p: ProductId) => LOCS.filter((l) => l.product === p).map((l) => l.id);

export const TASK_ID = '40543';
export const TASK_DATE = '31/07/2023 - 13:07';
export const TASK_DATE_DONE = '31/07/2023 - 13:09';

export const pad2 = (n: number) => String(n).padStart(2, '0');
