import { useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import { icons } from './icons';
import { cx } from './ui';
import { useI18n } from '../i18n';

/** Width of the revealed red "Out of Stock" area (and of the darker delete area, as in the Figma slide). */
const OPEN_OOS = 80;
const OPEN_DELETE = 137;
const DRAG_START = 8;
/** Dragging past this share of the card width and releasing marks it out of stock right away. */
const FULL_SWIPE = 0.5;
const EXIT_MS = 200;

/**
 * Slide-left wrapper. `kind="oos"` marks a location Out of Stock; `kind="delete"` removes a card (only trash icon on a dark red area).
 * - release past ~half of the card: it slides all the way out and the location is marked Out of Stock
 * - release past half of the red area: stays open (tap the red area to confirm, tap the card to close)
 * - otherwise it snaps back
 */
export function SwipeOOS({
  open,
  onOpen,
  onClose,
  onOOS,
  kind = 'oos',
  children,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOOS: () => void;
  kind?: 'oos' | 'delete';
  children: ReactNode;
}) {
  const { t, rtl } = useI18n();
  const OPEN = kind === 'delete' ? OPEN_DELETE : OPEN_OOS;
  const sgn = rtl ? -1 : 1; // the card slides toward the start side, which is right in RTL
  const [drag, setDrag] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<number | null>(null);
  const start = useRef<{ x: number; base: number; id: number } | null>(null);
  const moved = useRef(false);

  const x = leaving ? -(wrapRef.current?.offsetWidth ?? OPEN) : (drag ?? (open ? -OPEN : 0));
  const setDragBoth = (v: number | null) => {
    dragRef.current = v;
    setDrag(v);
  };

  const confirm = () => {
    setLeaving(true);
    setTimeout(onOOS, EXIT_MS);
  };

  const onDown = (e: PointerEvent) => {
    start.current = { x: e.clientX, base: open ? -OPEN : 0, id: e.pointerId };
    moved.current = false;
  };
  const onMove = (e: PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const delta = (e.clientX - s.x) * sgn;
    if (!moved.current && Math.abs(delta) > DRAG_START) {
      moved.current = true;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(s.id);
      } catch {
        /* synthetic pointer (tests) — keep going without capture */
      }
    }
    if (moved.current) setDragBoth(Math.max(-(wrapRef.current?.offsetWidth ?? OPEN), Math.min(0, s.base + delta)));
  };
  const onUp = () => {
    if (!start.current) return;
    start.current = null;
    if (moved.current) {
      const width = wrapRef.current?.offsetWidth ?? OPEN;
      const cur = dragRef.current ?? 0;
      setDragBoth(null);
      if (cur < -width * FULL_SWIPE) confirm();
      else if (cur < -OPEN / 2) onOpen();
      else onClose();
      // swallow the click that follows a drag
      setTimeout(() => (moved.current = false), 0);
    }
  };
  const onClickCapture = (e: MouseEvent) => {
    if (moved.current) {
      e.stopPropagation();
      e.preventDefault();
    } else if (open) {
      e.stopPropagation();
      e.preventDefault();
      onClose();
    }
  };

  const revealed = x < 0;

  return (
    <div className={cx('swipe', revealed && 'swipe--open')} ref={wrapRef}>
      <button
        type="button"
        className={cx('swipe__oos', kind === 'delete' && 'swipe__oos--delete')}
        aria-label={kind === 'delete' ? t('deleteBatchAria') : t('outOfStockAria')}
        tabIndex={revealed ? 0 : -1}
        style={{ width: Math.max(OPEN, -x) }}
        disabled={leaving}
        onClick={confirm}
      >
        {kind === 'delete' ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5" />
          </svg>
        ) : (
          <>
            <img src={icons.alertTriangle} alt="" />
            <span className="swipe__oos-text">{t('outOfStock')}</span>
          </>
        )}
      </button>
      <div
        className={cx('swipe__content', drag == null && 'swipe__content--settle')}
        style={{ transform: x ? `translateX(${x * sgn}px)` : undefined }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
