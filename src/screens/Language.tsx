import type { Dispatch } from 'react';
import { LANGS, useI18n } from '../i18n';
import type { Action } from '../state';
import { icons } from '../components/icons';

/** Language picker (A1 → help icon). Picking a language applies it and goes back to Audits. */
export function Language({ dispatch }: { dispatch: Dispatch<Action> }) {
  const { t, lang } = useI18n();
  return (
    <div className="screen screen-enter pl">
      <div className="lang">
        <header className="lang__head">
          <button type="button" className="lang__back" aria-label={t('back')} onClick={() => dispatch({ type: 'back' })}>
            <img src={icons.arrowBack} alt="" />
          </button>
          <h1>{t('language')}</h1>
        </header>
        <div className="lang__body">
          <ul className="lang__list">
            {LANGS.map((l) => (
              <li key={l.id}>
                <button type="button" className="lang__row" aria-current={l.id === lang} onClick={() => dispatch({ type: 'setLang', lang: l.id, leave: true })}>
                  <span>{l.label}</span>
                  <img className="lang__chev" src={icons.chevronLang} alt="" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
