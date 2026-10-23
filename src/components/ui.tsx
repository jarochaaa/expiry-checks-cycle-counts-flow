import type { ReactNode } from 'react';
import { icons } from './icons';
import type { Pill as PillKind } from '../state';
import { useI18n } from '../i18n';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/** Location pin with the 1st / 2nd location number inside. */
export function LocPin({ num }: { num: 1 | 2 }) {
  return (
    <span className="pin" aria-label={`Location ${num}`}>
      <img className="pin__base" src={icons.pinEmpty} alt="" />
      <img className={num === 1 ? 'pin__1' : 'pin__2'} src={num === 1 ? icons.pin1 : icons.pin2} alt="" />
    </span>
  );
}

export function StatusPill({ kind }: { kind: Exclude<PillKind, null> }) {
  const { t } = useI18n();
  return (
    <span className={cx('pill', kind === 'recount' ? 'pill--recount' : 'pill--counting')}>
      <span className="pill__icon">
        <img src={kind === 'recount' ? icons.syncWarning : icons.tripPill} alt="" />
      </span>
      {kind === 'recount' ? t('recount') : t('counting')}
    </span>
  );
}

export function Toast({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="toast" role="alert" onClick={onClick}>
      {children}
    </button>
  );
}

export function Header({ title, onBack, actions, app }: { title: string; onBack?: () => void; actions?: boolean; app?: boolean }) {
  const { t } = useI18n();
  return (
    <header className="header">
      {onBack && (
        <button type="button" className="header__back" aria-label={t('back')} onClick={onBack}>
          <img src={icons.arrowBack} alt="" />
        </button>
      )}
      <h1 className={cx('header__title', app && 'header__title--app')}>{title}</h1>
      {actions && (
        <div className="header__actions" aria-hidden>
          <img src={icons.headset} alt="" />
          <img src={icons.account} alt="" />
        </div>
      )}
    </header>
  );
}

export function TaskCardInfo({ id, date }: { id: string; date: string }) {
  return (
    <>
      <div className="task-card__id">
        <img src={icons.layers} alt="" />
        {id}
      </div>
      <div className="task-card__date">
        <span style={{ position: 'relative', width: 16, height: 16 }}>
          <img src={icons.clock} alt="" style={{ position: 'absolute', inset: 0, width: 16, height: 16 }} />
          <img src={icons.clockHands} alt="" style={{ position: 'absolute', inset: '8.33%', width: '83.34%', height: '83.34%' }} />
        </span>
        {date}
      </div>
    </>
  );
}

export function Chips({ skus, alerts }: { skus: number; alerts: number }) {
  return (
    <div className="chips">
      <span className="chip">
        <span className="chip__icon">
          <img src={icons.wineBottle} alt="" style={{ position: 'absolute', inset: '2.08% 19.79%', width: '60.42%', height: '95.84%' }} />
        </span>
        {skus}
      </span>
      <span className="chip chip--alert">
        <span className="chip__icon">
          <img src={icons.archiveLocker} alt="" style={{ position: 'absolute', inset: '0 8.33%', width: '83.34%', height: '100%' }} />
        </span>
        {alerts}
      </span>
    </div>
  );
}
