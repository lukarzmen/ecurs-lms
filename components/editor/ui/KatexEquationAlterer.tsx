import './KatexEquationAlterer.css';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import * as React from 'react';
import {useCallback, useState} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import {useI18n} from '@/hooks/use-i18n';

import Button from '../ui/Button';
import KatexRenderer from './KatexRenderer';

type Props = {
  initialEquation?: string;
  onConfirm: (equation: string, inline: boolean) => void;
};

export default function KatexEquationAlterer({
  onConfirm,
  initialEquation = '',
}: Props): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const {t} = useI18n();
  const [equation, setEquation] = useState<string>(initialEquation);
  const [inline, setInline] = useState<boolean>(true);

  const onClick = useCallback(() => {
    onConfirm(equation, inline);
  }, [onConfirm, equation, inline]);

  const onCheckboxChange = useCallback(() => {
    setInline(!inline);
  }, [setInline, inline]);

  return (
    <div className="KatexEquationAlterer_container">
      <div className="KatexEquationAlterer_header">
        <h3 className="KatexEquationAlterer_title">{t('ed.katexTitle')}</h3>
        <p className="KatexEquationAlterer_subtitle">{t('ed.katexSubtitle')}</p>
      </div>
      
      <div className="KatexEquationAlterer_section">
        <label className="KatexEquationAlterer_label">
          <div className="KatexEquationAlterer_labelText">
            <span className="KatexEquationAlterer_labelIcon">📐</span>
            {t('ed.katexDisplayMode')}
          </div>
          <label className="KatexEquationAlterer_checkboxWrapper">
            <input
              type="checkbox"
              checked={inline}
              onChange={onCheckboxChange}
              className="KatexEquationAlterer_checkbox"
            />
            <span className="KatexEquationAlterer_checkboxLabel">
              {inline ? t('ed.katexInlineMode') : t('ed.katexBlockMode')}
            </span>
          </label>
        </label>
      </div>
      
      <div className="KatexEquationAlterer_section">
        <label className="KatexEquationAlterer_label">
          <div className="KatexEquationAlterer_labelText">
            <span className="KatexEquationAlterer_labelIcon">✏️</span>
            {t('ed.katexEquationLabel')}
          </div>
          {inline ? (
            <input
              onChange={(event) => {
                setEquation(event.target.value);
              }}
              value={equation}
              placeholder={t('ed.katexInlinePlaceholder')}
              className="KatexEquationAlterer_input"
              autoFocus
            />
          ) : (
            <textarea
              onChange={(event) => {
                setEquation(event.target.value);
              }}
              value={equation}
              placeholder={t('ed.katexBlockPlaceholder')}
              className="KatexEquationAlterer_textarea"
              rows={4}
              autoFocus
            />
          )}
        </label>
      </div>
      
      <div className="KatexEquationAlterer_section">
        <div className="KatexEquationAlterer_label">
          <div className="KatexEquationAlterer_labelText">
            <span className="KatexEquationAlterer_labelIcon">👁️</span>
            {t('ed.katexLivePreview')}
          </div>
          <div className="KatexEquationAlterer_preview">
            <ErrorBoundary 
              onError={(e) => editor._onError(e)} 
              fallback={<div className="KatexEquationAlterer_error">{t('ed.katexSyntaxError')}</div>}
            >
              {equation ? (
                <KatexRenderer
                  equation={equation}
                  inline={false}
                  onDoubleClick={() => null}
                />
              ) : (
                <div className="KatexEquationAlterer_placeholder">{t('ed.katexPreviewPlaceholder')}</div>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
      
      <div className="KatexEquationAlterer_footer">
        <Button onClick={onClick} className="KatexEquationAlterer_confirmButton">
          {t('ed.katexInsertFormula')}
        </Button>
      </div>
    </div>
  );
}
