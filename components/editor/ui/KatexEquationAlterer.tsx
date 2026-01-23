import './KatexEquationAlterer.css';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import * as React from 'react';
import {useCallback, useState} from 'react';
import {ErrorBoundary} from 'react-error-boundary';

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
        <h3 className="KatexEquationAlterer_title">Wstaw równanie matematyczne</h3>
        <p className="KatexEquationAlterer_subtitle">Użyj składni LaTeX do utworzenia równania</p>
      </div>
      
      <div className="KatexEquationAlterer_section">
        <label className="KatexEquationAlterer_label">
          <div className="KatexEquationAlterer_labelText">
            <span className="KatexEquationAlterer_labelIcon">📐</span>
            Tryb wyświetlania
          </div>
          <label className="KatexEquationAlterer_checkboxWrapper">
            <input
              type="checkbox"
              checked={inline}
              onChange={onCheckboxChange}
              className="KatexEquationAlterer_checkbox"
            />
            <span className="KatexEquationAlterer_checkboxLabel">
              {inline ? 'W linii tekstu' : 'Wycentrowane (blok)'}
            </span>
          </label>
        </label>
      </div>
      
      <div className="KatexEquationAlterer_section">
        <label className="KatexEquationAlterer_label">
          <div className="KatexEquationAlterer_labelText">
            <span className="KatexEquationAlterer_labelIcon">✏️</span>
            Równanie (LaTeX)
          </div>
          {inline ? (
            <input
              onChange={(event) => {
                setEquation(event.target.value);
              }}
              value={equation}
              placeholder="np. E = mc^2"
              className="KatexEquationAlterer_input"
              autoFocus
            />
          ) : (
            <textarea
              onChange={(event) => {
                setEquation(event.target.value);
              }}
              value={equation}
              placeholder="np. \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"
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
            Podgląd na żywo
          </div>
          <div className="KatexEquationAlterer_preview">
            <ErrorBoundary 
              onError={(e) => editor._onError(e)} 
              fallback={<div className="KatexEquationAlterer_error">❌ Błąd w składni LaTeX</div>}
            >
              {equation ? (
                <KatexRenderer
                  equation={equation}
                  inline={false}
                  onDoubleClick={() => null}
                />
              ) : (
                <div className="KatexEquationAlterer_placeholder">Wpisz równanie, aby zobaczyć podgląd</div>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
      
      <div className="KatexEquationAlterer_footer">
        <Button onClick={onClick} className="KatexEquationAlterer_confirmButton">
          ✓ Wstaw wzór
        </Button>
      </div>
    </div>
  );
}
