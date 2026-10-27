import type { Dispatch } from 'react';
import { COUNT_TICKETS, REMOVAL_TICKETS } from '../data';
import type { ProductId, Ticket } from '../data';
import type { Action, AuditsTab } from '../state';
import { icons } from '../components/icons';
import { cx } from '../components/ui';
import { useI18n } from '../i18n';

function TicketCard({ t, onOpen, showTag, showProducts }: { t: Ticket; onOpen?: () => void; showTag?: boolean; showProducts?: boolean }) {
  const { t: tr } = useI18n();
  const body = (
    <>
      <div className="ticket__line">
        <span className="ticket__id">{t.id}</span>
        <span className="ticket__date">{t.date}</span>
      </div>
      <div className="ticket__second">
        {showTag && t.tag && <span className="ptag ptag--text">{t.tag === 'Expiry Checks' ? tr('expiryLevel') : tr('locationLevel')}</span>}
        {showProducts && t.products != null && <span className="ticket__products">{tr('products', { n: t.products })}</span>}
      </div>
    </>
  );
  return onOpen ? (
    <button type="button" className="ticket" onClick={onOpen}>
      {body}
    </button>
  ) : (
    <div className="ticket">{body}</div>
  );
}

export function Audits({ tab, created, dispatch }: { tab: AuditsTab; created: { id: string; date: string; products: ProductId[] }[]; dispatch: Dispatch<Action> }) {
  const { t } = useI18n();
  const count = tab === 'count';
  const base = count ? COUNT_TICKETS : REMOVAL_TICKETS;
  const data = count ? { ...base, todo: [...created.map((c): Ticket => ({ id: c.id, date: c.date, tag: 'Expiry Checks' })), ...base.todo] } : base;
  return (
    <div className="screen screen-enter pl">
      <div className="audits">
        <div className="audits__head">
          <div className="audits__actions">
            <span className="circle-btn" aria-hidden>
              <img src={icons.userCircle} alt="" />
            </span>
            <button type="button" className="circle-btn" aria-label={t('help')} onClick={() => dispatch({ type: 'openLanguage' })}>
              <img src={icons.helpCircle} alt="" />
            </button>
          </div>
          <h1 className="audits__title">{t('audits')}</h1>
        </div>

        <div className="p-tabs" role="tablist">
          <div className="p-tabs__row">
            <button type="button" role="tab" aria-selected={count} className="p-tab" onClick={() => dispatch({ type: 'auditsTab', tab: 'count' })}>
              <span className="p-tab__label">{t('countTasks')}</span>
              {count && <span className="p-tab__bar" />}
            </button>
            <button type="button" role="tab" aria-selected={!count} className="p-tab" onClick={() => dispatch({ type: 'auditsTab', tab: 'removal' })}>
              <span className="p-tab__label">{t('removalTasks')}</span>
              {!count && <span className="p-tab__bar" />}
            </button>
          </div>
          <span className="p-tabs__line" />
        </div>

        {count && (
          <div className="segments" aria-hidden>
            <span className="segment segment--on">{t('cycleCount')}</span>
            <span className="segment">{t('fullStoreCount')}</span>
          </div>
        )}

        <div className="audits__scroll">
          <p className="audits__section">{t('inProgress')}</p>
          {data.inProgress.map((t) => (
            <TicketCard key={t.id} t={t} showTag={count} showProducts={!count} onOpen={count && t.tag === 'Expiry Checks' ? () => dispatch({ type: 'openTicket', id: t.id, scope: created.find((c) => c.id === t.id)?.products }) : undefined} />
          ))}
          <p className="audits__section">{t('toDo')}</p>
          {data.todo.map((t) => (
            <TicketCard key={t.id} t={t} showTag={count} showProducts={!count} onOpen={count && t.tag === 'Expiry Checks' ? () => dispatch({ type: 'openTicket', id: t.id, scope: created.find((c) => c.id === t.id)?.products }) : undefined} />
          ))}
        </div>

        <nav className="bottom-nav" aria-hidden>
          <div className="bottom-nav__item">
            <img src={icons.navOrders} alt="" />
            {t('orders')}
          </div>
          <div className={cx('bottom-nav__item', 'bottom-nav__item--on')}>
            <img src={icons.navAudits} alt="" />
            {t('audits')}
          </div>
          <div className="bottom-nav__item">
            <img src={icons.navReceiving} alt="" />
            {t('receiving')}
          </div>
          <div className="bottom-nav__item">
            <img src={icons.navMore} alt="" />
            {t('more')}
          </div>
        </nav>
      </div>
    </div>
  );
}
