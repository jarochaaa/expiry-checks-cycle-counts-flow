import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export type Lang = 'en' | 'es' | 'ar';
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'ar', label: 'العربية' },
];

const en = {
  audits: 'Cycle Counts',
  countTasks: 'Count Tasks',
  removalTasks: 'Removal Tasks',
  cycleCount: 'Cycle Count',
  fullStoreCount: 'Full Store Count',
  inProgress: 'In progress',
  toDo: 'To do',
  orders: 'Orders',
  receiving: 'Receiving',
  more: 'More',
  products: '{n} products',
  locationLevel: 'Count Checks',
  expiryLevel: 'Expiry Checks',
  language: 'Language',
  help: 'Help and language',
  startTitle: 'Do you want to start this task?',
  start: 'Start',
  toBeProcessed: 'To be processed',
  processed: 'Processed',
  discrepancyList: '**Stock Discrepancy.**\nProduct Total Units don’t match. Please **Recount** all locations for this product.',
  discrepancyPdp: '**Stock Discrepancy.** Product total units don’t match. Please **recount** all locations for this product, starting with **this one**.',
  recount: 'Recount',
  counting: 'Counting',
  multiLoc: 'Product on Multiple Locations',
  outOfStock: 'Out of\nStock',
  outOfStockAria: 'Mark as out of stock',
  deleteBatchAria: 'Delete this expiry date',
  complete: 'Complete',
  hintTitle: 'How to check Expiry Dates',
  hintBody: 'Count the total units for each listed Expiry Date within this location. If any expiry dates are missing, please create a new batch for them.',
  countAll: 'Count all items with Expiry Date',
  quantity: 'Quantity',
  addBatches: 'Add batches',
  confirm: 'Confirm',
  done: 'Done',
  apply: 'Apply',
  calQuestion: 'Which expiry date you want to capture?',
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  back: 'Back',
  close: 'Close',
  sendTitle: 'You are about to send the following\ninventory count:',
  send: 'Send',
  greatWork: 'Great work!',
  completedCount: 'You have completed this Cycle Count!',
  gotIt: 'Got it!',
  'alert.network': 'We could not retrieve product information. Please check your internet connection and try again.',
  'alert.wrong': 'The Product you scanned is not in the list. Please try again.',
  'alert.error': 'An error occurred. Please try again.',
  weekdays: 'S,M,T,W,T,F,S',
  locale: 'en-US',
};

type Dict = typeof en;

const es: Dict = {
  audits: 'Cycle Counts',
  countTasks: 'Tareas de conteo',
  removalTasks: 'Tareas de retiro',
  cycleCount: 'Conteo cíclico',
  fullStoreCount: 'Conteo total de tienda',
  inProgress: 'En curso',
  toDo: 'Por hacer',
  orders: 'Pedidos',
  receiving: 'Recepción',
  more: 'Más',
  products: '{n} productos',
  locationLevel: 'Count Checks',
  expiryLevel: 'Expiry Checks',
  language: 'Idioma',
  help: 'Ayuda e idioma',
  startTitle: '¿Quieres iniciar esta tarea?',
  start: 'Iniciar',
  toBeProcessed: 'Por procesar',
  processed: 'Procesados',
  discrepancyList: '**Discrepancia de stock.**\nEl total de unidades del producto no coincide. Por favor, **recuenta** todas las ubicaciones de este producto.',
  discrepancyPdp: '**Discrepancia de stock.** El total de unidades del producto no coincide. Por favor, **recuenta** todas las ubicaciones de este producto, empezando por **esta**.',
  recount: 'Recuento',
  counting: 'Contando',
  multiLoc: 'Producto en varias ubicaciones',
  outOfStock: 'Sin\nstock',
  outOfStockAria: 'Marcar como sin stock',
  deleteBatchAria: 'Eliminar esta fecha de vencimiento',
  complete: 'Completar',
  hintTitle: 'Cómo revisar las fechas de vencimiento',
  hintBody: 'Cuenta el total de unidades de cada fecha de vencimiento listada en esta ubicación. Si falta alguna fecha de vencimiento, crea un nuevo lote para ella.',
  countAll: 'Cuenta todos los artículos con fecha de vencimiento',
  quantity: 'Cantidad',
  addBatches: 'Añadir lotes',
  confirm: 'Confirmar',
  done: 'Listo',
  apply: 'Aplicar',
  calQuestion: '¿Qué fecha de vencimiento quieres registrar?',
  prevMonth: 'Mes anterior',
  nextMonth: 'Mes siguiente',
  back: 'Atrás',
  close: 'Cerrar',
  sendTitle: 'Vas a enviar el siguiente\nconteo de inventario:',
  send: 'Enviar',
  greatWork: '¡Buen trabajo!',
  completedCount: '¡Has completado este conteo cíclico!',
  gotIt: '¡Entendido!',
  'alert.network': 'No pudimos obtener la información del producto. Revisa tu conexión a internet e inténtalo de nuevo.',
  'alert.wrong': 'El producto que escaneaste no está en la lista. Inténtalo de nuevo.',
  'alert.error': 'Ocurrió un error. Inténtalo de nuevo.',
  weekdays: 'D,L,M,X,J,V,S',
  locale: 'es',
};

const ar: Dict = {
  audits: 'Cycle Counts',
  countTasks: 'مهام الجرد',
  removalTasks: 'مهام الإزالة',
  cycleCount: 'الجرد الدوري',
  fullStoreCount: 'جرد المتجر الكامل',
  inProgress: 'قيد التنفيذ',
  toDo: 'للتنفيذ',
  orders: 'الطلبات',
  receiving: 'الاستلام',
  more: 'المزيد',
  products: '{n} منتجات',
  locationLevel: 'Count Checks',
  expiryLevel: 'Expiry Checks',
  language: 'اللغة',
  help: 'المساعدة واللغة',
  startTitle: 'هل تريد بدء هذه المهمة؟',
  start: 'ابدأ',
  toBeProcessed: 'للمعالجة',
  processed: 'تمت المعالجة',
  discrepancyList: '**عدم تطابق في المخزون.**\nإجمالي وحدات المنتج غير متطابق. يرجى **إعادة عد** جميع مواقع هذا المنتج.',
  discrepancyPdp: '**عدم تطابق في المخزون.** إجمالي وحدات المنتج غير متطابق. يرجى **إعادة عد** جميع مواقع هذا المنتج، بدءًا من **هذا الموقع**.',
  recount: 'إعادة العد',
  counting: 'قيد العد',
  multiLoc: 'منتج في مواقع متعددة',
  outOfStock: 'نفد\nالمخزون',
  outOfStockAria: 'تحديد كنفاد المخزون',
  deleteBatchAria: 'حذف تاريخ الصلاحية هذا',
  complete: 'إكمال',
  hintTitle: 'كيفية التحقق من تواريخ الانتهاء',
  hintBody: 'احسب إجمالي الوحدات لكل تاريخ انتهاء مدرج ضمن هذا الموقع. إذا كانت هناك تواريخ انتهاء مفقودة، يرجى إنشاء دفعة جديدة لها.',
  countAll: 'احسب جميع العناصر بتاريخ الانتهاء',
  quantity: 'الكمية',
  addBatches: 'إضافة دفعات',
  confirm: 'تأكيد',
  done: 'تم',
  apply: 'تطبيق',
  calQuestion: 'ما تاريخ الانتهاء الذي تريد تسجيله؟',
  prevMonth: 'الشهر السابق',
  nextMonth: 'الشهر التالي',
  back: 'رجوع',
  close: 'إغلاق',
  sendTitle: 'أنت على وشك إرسال\nجرد المخزون التالي:',
  send: 'إرسال',
  greatWork: 'عمل رائع!',
  completedCount: 'لقد أكملت هذا الجرد الدوري!',
  gotIt: 'فهمت!',
  'alert.network': 'تعذّر استرجاع معلومات المنتج. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
  'alert.wrong': 'المنتج الذي قمت بمسحه غير موجود في القائمة. يرجى المحاولة مرة أخرى.',
  'alert.error': 'حدث خطأ. يرجى المحاولة مرة أخرى.',
  weekdays: 'ح,ن,ث,ر,خ,ج,س',
  locale: 'ar-u-nu-latn',
};

const DICTS: Record<Lang, Dict> = { en, es, ar };
export type Key = keyof Dict;

interface I18n {
  lang: Lang;
  rtl: boolean;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  /** **bold** and \n markup → React nodes */
  rich: (key: Key) => ReactNode;
}

export const makeI18n = (lang: Lang): I18n => {
  const d = DICTS[lang];
  const t: I18n['t'] = (key, vars) => Object.entries(vars ?? {}).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), d[key]);
  const rich: I18n['rich'] = (key) =>
    d[key].split('\n').flatMap((line, i, arr) => [
      ...line.split('**').map((part, j) => (j % 2 ? <strong key={`${i}-${j}`}>{part}</strong> : part)),
      ...(i < arr.length - 1 ? [<br key={`br${i}`} />] : []),
    ]);
  return { lang, rtl: lang === 'ar', t, rich };
};

const Ctx = createContext<I18n>(makeI18n('en'));
export const I18nProvider = Ctx.Provider;
export const useI18n = () => useContext(Ctx);
