/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {CAN_USE_BEFORE_INPUT} from '@lexical/utils';
import {useEffect, useMemo, useState} from 'react';

import {INITIAL_SETTINGS} from './appSettings';
import {useSettings} from './context/SettingsContext';
import Switch from './ui/Switch';

export default function Settings(): JSX.Element {
  const windowLocation = typeof window !== 'undefined' ? window.location : { search: '' };
  const {
    setOption,
    settings: {
      measureTypingPerf,
      isCollab,
      isRichText,
      isMaxLength,
      hasLinkAttributes,
      isCharLimit,
      isCharLimitUtf8,
      isAutocomplete,
      showTreeView,
      showNestedEditorTreeView,
      disableBeforeInput,
      showTableOfContents,
      shouldUseLexicalContextMenu,
      shouldPreserveNewLinesInMarkdown,
    },
  } = useSettings();
  useEffect(() => {
    if (INITIAL_SETTINGS.disableBeforeInput && CAN_USE_BEFORE_INPUT) {
      console.error(
        `Legacy events are enabled (disableBeforeInput) but CAN_USE_BEFORE_INPUT is true`,
      );
    }
  }, []);
  const [showSettings, setShowSettings] = useState(false);
  const [isSplitScreen, search] = useMemo(() => {
    const parentWindow = typeof window !== 'undefined' ? window.parent : null;
    const _search = windowLocation.search;
    const _isSplitScreen =
      parentWindow && parentWindow.location.pathname === '/split/';
    return [_isSplitScreen, _search];
  }, [windowLocation]);

  return (
    <>
      <button
        className={`toolbar-item spaced ${showSettings ? 'active' : ''}`}
        onClick={() => setShowSettings(!showSettings)}>
          <i className="format settings" />
        </button>
      {showSettings ? (
        <div className="switches">
          {isRichText && (
            <Switch
              onClick={() => {
                setOption('isCollab', !isCollab);
                window.location.reload();
              }}
              checked={isCollab}
              text="Collaboration"
            />
          )}
          <Switch
            onClick={() => setOption('measureTypingPerf', !measureTypingPerf)}
            checked={measureTypingPerf}
            text="Measure Perf"
          />
          <Switch
            onClick={() => setOption('showTreeView', !showTreeView)}
            checked={showTreeView}
            text="Debug View"
          />
          <Switch
            onClick={() =>
              setOption('showNestedEditorTreeView', !showNestedEditorTreeView)
            }
            checked={showNestedEditorTreeView}
            text="Nested Editors Debug View"
          />
          <Switch
            onClick={() => {
              setOption('isRichText', !isRichText);
              setOption('isCollab', false);
            }}
            checked={isRichText}
            text="Rich Text"
          />
          <Switch
            onClick={() => setOption('isCharLimit', !isCharLimit)}
            checked={isCharLimit}
            text="Char Limit"
          />
          <Switch
            onClick={() => setOption('isCharLimitUtf8', !isCharLimitUtf8)}
            checked={isCharLimitUtf8}
            text="Char Limit (UTF-8)"
          />
          <Switch
            onClick={() => setOption('hasLinkAttributes', !hasLinkAttributes)}
            checked={hasLinkAttributes}
            text="Link Attributes"
          />
          <Switch
            onClick={() => setOption('isMaxLength', !isMaxLength)}
            checked={isMaxLength}
            text="Max Length"
          />
          <Switch
            onClick={() => setOption('isAutocomplete', !isAutocomplete)}
            checked={isAutocomplete}
            text="Autocomplete"
          />
          <Switch
            onClick={() => {
              setOption('disableBeforeInput', !disableBeforeInput);
              setTimeout(() => window.location.reload(), 500);
            }}
            checked={disableBeforeInput}
            text="Legacy Events"
          />
          <Switch
            onClick={() => {
              setOption('showTableOfContents', !showTableOfContents);
            }}
            checked={showTableOfContents}
            text="Table Of Contents"
          />
          <Switch
            onClick={() => {
              setOption(
                'shouldUseLexicalContextMenu',
                !shouldUseLexicalContextMenu,
              );
            }}
            checked={shouldUseLexicalContextMenu}
            text="Use Lexical Context Menu"
          />
          <Switch
            onClick={() => {
              setOption(
                'shouldPreserveNewLinesInMarkdown',
                !shouldPreserveNewLinesInMarkdown,
              );
            }}
            checked={shouldPreserveNewLinesInMarkdown}
            text="Preserve newlines in Markdown"
          />
        </div>
      ) : null}
    </>
  );
}
