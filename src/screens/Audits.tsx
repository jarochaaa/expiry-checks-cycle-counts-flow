import type { Dispatch } from 'react';
import { COUNT_TICKETS, REMOVAL_TICKETS } from '../data';
import type { Ticket } from '../data';
import type { Action, AuditsTab } from '../state';
import { icons } from '../components/icons';
import { cx } from '../components/ui';

function TicketCard({ t, onOpen, showTag, showProducts }: { t: Ticket; onOpen?: () => void; showTag?: boolean; showProducts?: boolean }) {
  const body = (
    <>
      <div className="ticket__line">
        <span className="ticket__id">{t.id}</span>
        <span className="ticket__date">{t.date}</span>
      </div>
      <div className="ticket__second">
        {showTag && t.tag && <span className="ptag">{t.tag}</span>}
        {showProducts && t.products != null && <span className="ticket__products">{t.products} products</span>}
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

export function Audits({ tab, dispatch }: { tab: AuditsTab; dispatch: Dispatch<Action> }) {
  const count = tab === 'count';
  const data = count ? COUNT_TICKETS : REMOVAL_TICKETS;
  return (
    <div className="screen screen-enter pl">
      <div className="audits">
        <div className="audits__head">
          <div className="audits__actions" aria-hidden>
            <span className="circle-btn">
              <img src={icons.userCircle} alt="" />
            </span>
            <span className="circle-btn">
              <img src={icons.helpCircle} alt="" />
            </span>
          </div>
          <h1 className="audits__title">Audits</h1>
        </div>

        <div className="p-tabs" role="tablist">
          <div className="p-tabs__row">
            <button type="button" role="tab" aria-selected={count} className="p-tab" onClick={() => dispatch({ type: 'auditsTab', tab: 'count' })}>
              <span className="p-tab__label">Count Tasks</span>
              {count && <span className="p-tab__bar" />}
            </button>
            <button type="button" role="tab" aria-selected={!count} className="p-tab" onClick={() => dispatch({ type: 'auditsTab', tab: 'removal' })}>
              <span className="p-tab__label">Removal Tasks</span>
              {!count && <span className="p-tab__bar" />}
            </button>
          </div>
          <span className="p-tabs__line" />
        </div>

        {count && (
          <div className="segments" aria-hidden>
            <span className="segment segment--on">Cycle Count</span>
            <span className="segment">Full Store Count</span>
          </div>
        )}

        <div className="audits__scroll">
          <p className="audits__section">In progress</p>
          {data.inProgress.map((t) => (
            <TicketCard key={t.id} t={t} showTag={count} showProducts={!count} onOpen={count && t.tag === 'Expiry Level' ? () => dispatch({ type: 'openTicket', id: t.id }) : undefined} />
          ))}
          <p className="audits__section">To do</p>
          {data.todo.map((t) => (
            <TicketCard key={t.id} t={t} showTag={count} showProducts={!count} onOpen={count && t.tag === 'Expiry Level' ? () => dispatch({ type: 'openTicket', id: t.id }) : undefined} />
          ))}
        </div>

        <nav className="bottom-nav" aria-hidden>
          <div className="bottom-nav__item">
            <img src={icons.navOrders} alt="" />
            Orders
          </div>
          <div className={cx('bottom-nav__item', 'bottom-nav__item--on')}>
            <img src={icons.navAudits} alt="" />
            Audits
          </div>
          <div className="bottom-nav__item">
            <img src={icons.navReceiving} alt="" />
            Receiving
          </div>
          <div className="bottom-nav__item">
            <img src={icons.navMore} alt="" />
            More
          </div>
        </nav>
      </div>
    </div>
  );
}
