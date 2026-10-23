import type { Dispatch } from 'react';
import { LOC_BY_ID } from '../data';
import type { LocId, ProductId } from '../data';
import { allDone, doneLocs, pendingLocs, pillFor } from '../state';
import type { Action, State } from '../state';
import { LocationCard } from '../components/LocationCard';
import { SwipeOOS } from '../components/SwipeOOS';
import { icons } from '../components/icons';
import { Header, cx } from '../components/ui';
import { useI18n } from '../i18n';

export function SkuList({ s, dispatch }: { s: State; dispatch: Dispatch<Action> }) {
  const { t, rich } = useI18n();
  const pending = pendingLocs(s);
  const done = doneLocs(s);
  const todoTab = s.tab === 'todo';
  const finished = allDone(s);

  return (
    <div className="screen screen-enter">
      <Header title={s.taskId} onBack={() => dispatch({ type: 'back' })} />
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={todoTab} aria-label={t('toBeProcessed')} className="tabs__tab" onClick={() => dispatch({ type: 'tab', tab: 'todo' })}>
          <img src={icons.tabTodo} alt="" />
        </button>
        <button type="button" role="tab" aria-selected={!todoTab} aria-label={t('processed')} className="tabs__tab" onClick={() => dispatch({ type: 'tab', tab: 'done' })}>
          <img src={icons.tabDone} alt="" />
        </button>
      </div>
      <div className="panel">
        <div className={cx('panel__scroll', finished && 'panel__scroll--cta')}>
          <p className={cx('panel__label', todoTab ? 'panel__label--todo' : 'panel__label--done')}>{todoTab ? t('toBeProcessed') : t('processed')}</p>
          {todoTab && s.banner && (
            <div className="discrepancy" role="status">
              <img className="dark-icon" src={icons.alertTriangle} alt="" />
              <p>{rich('discrepancyList')}</p>
            </div>
          )}
          <div className="list">
            {todoTab &&
              pending.map((id) => (
                <SwipeOOS key={id} open={s.swipe === id} onOpen={() => dispatch({ type: 'swipe', loc: id })} onClose={() => dispatch({ type: 'swipe', loc: null })} onOOS={() => dispatch({ type: 'oos', loc: id })}>
                  <LocationCard id={id} pill={pillFor(s, id)} onScan={() => dispatch({ type: 'scan', loc: id })} onImage={() => dispatch({ type: 'detail', product: idProduct(id) })} />
                </SwipeOOS>
              ))}
            {!todoTab &&
              done.map((id) => (
                <LocationCard key={id} id={id} pill={pillFor(s, id)} done={s.locs[id]} onImage={() => dispatch({ type: 'detail', product: idProduct(id) })} />
              ))}
          </div>
        </div>
        {finished && (
          <button type="button" className="btn btn--primary cta" onClick={() => dispatch({ type: 'complete' })} disabled={s.sending}>
            {t('complete')}
          </button>
        )}
      </div>
    </div>
  );
}

const idProduct = (id: LocId): ProductId => LOC_BY_ID[id].product;
