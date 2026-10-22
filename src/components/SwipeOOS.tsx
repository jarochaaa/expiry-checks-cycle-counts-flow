import { useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import { icons } from './icons';
import { cx } from './ui';

/** Width of the revealed red "Out of Stock" area. */
const OPEN = 80;
const DRAG_START = 8;
/** Dragging past this share of the card width and releasing marks it out of stock right away. */
const FULL_SWIPE = 0.5;
const EXIT_MS = 200;

/**
 * Slide-left-to-mark-out-of-stock wrapper.
 * - release past ~half of the card: it slides all the way out and the location is marked Out of Stock
 * - release past half of the red area: stays open (tap the red area to confirm, tap the card to close)
 * - otherwise it snaps back
 */
export function SwipeOOS({
  open,
  onOpen,
  onClose,
  onOOS,
  children,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOOS: () => void;
  children: ReactNode;
}) {
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
    const delta = e.clientX - s.x;
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
        className="swipe__oos"
        aria-label="Mark as out of stock"
        tabIndex={revealed ? 0 : -1}
        style={{ width: Math.max(OPEN, -x) }}
        disabled={leaving}
        onClick={confirm}
      >
        <img src={icons.alertTriangle} alt="" />
        <span>
          Out of
          <br />
          Stock
        </span>
      </button>
      <div
        className={cx('swipe__content', drag == null && 'swipe__content--settle')}
        style={{ transform: x ? `translateX(${x}px)` : undefined }}
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
