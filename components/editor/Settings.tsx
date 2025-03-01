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
      isMaxLength,
      isAutocomplete,
      showTableOfContents,
      shouldUseLexicalContextMenu,
      shouldPreserveNewLinesInMarkdown,
    },
  } = useSettings();

  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <button
        className={`toolbar-item last spaced ${showSettings ? 'active' : ''}`}
        onClick={() => setShowSettings(!showSettings)}>
          <i className="format settings" />
        </button>
      {showSettings ? (
        <div className="switches">         
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
