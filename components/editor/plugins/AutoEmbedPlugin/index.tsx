/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {LexicalEditor} from 'lexical';
import {
  AutoEmbedOption,
  EmbedConfig,
  EmbedMatchResult,
  LexicalAutoEmbedPlugin,
  URL_MATCHER,
} from '@lexical/react/LexicalAutoEmbedPlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useMemo, useState} from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import useModal from '../../hooks/useModal';
import Button from '../../ui/Button';
import {DialogActions} from '../../ui/Dialog';
import {INSERT_YOUTUBE_COMMAND} from '../YouTubePlugin';

interface PlaygroundEmbedConfig extends EmbedConfig {
  contentName: string;
  icon?: JSX.Element;
  exampleUrl: string;
  keywords: Array<string>;
  description?: string;
}

export const YoutubeEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'YouTube',
  exampleUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
  icon: <i className="icon youtube" />,
  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, result.id);
  },
  keywords: ['youtube', 'video'],
  parseUrl: async (url: string) => {
    const match = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);
    const id = match ? (match?.[2].length === 11 ? match[2] : null) : null;
    if (id != null) {
      return { id, url };
    }
    return null;
  },
  type: 'youtube-video',
};

export const EmbedConfigs = [YoutubeEmbedConfig];

function AutoEmbedMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: AutoEmbedOption;
}) {
  let className = 'item';
  if (isSelected) {
    className += ' selected';
  }
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={`${className} cursor-pointer p-2 hover:bg-gray-100`}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}>
      <span className="text">{option.title}</span>
    </li>
  );
}

function AutoEmbedMenu({
  options,
  selectedItemIndex,
  onOptionClick,
  onOptionMouseEnter,
}: {
  selectedItemIndex: number | null;
  onOptionClick: (option: AutoEmbedOption, index: number) => void;
  onOptionMouseEnter: (index: number) => void;
  options: Array<AutoEmbedOption>;
}) {
  return (
    <div className="typeahead-popover bg-white shadow-lg rounded-lg p-4">
      <ul>
        {options.map((option: AutoEmbedOption, i: number) => (
          <AutoEmbedMenuItem
            index={i}
            isSelected={selectedItemIndex === i}
            onClick={() => onOptionClick(option, i)}
            onMouseEnter={() => onOptionMouseEnter(i)}
            key={option.key}
            option={option}
          />
        ))}
      </ul>
    </div>
  );
}

const debounce = (callback: (text: string) => void, delay: number) => {
  let timeoutId: number;
  return (text: string) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(text);
    }, delay);
  };
};

export function AutoEmbedDialog({
  embedConfig,
  onClose,
}: {
  embedConfig: PlaygroundEmbedConfig;
  onClose: () => void;
}): JSX.Element {
  const [text, setText] = useState('');
  const [editor] = useLexicalComposerContext();
  const [embedResult, setEmbedResult] = useState<EmbedMatchResult | null>(null);

  const validateText = useMemo(
    () =>
      debounce((inputText: string) => {
        const urlMatch = URL_MATCHER.exec(inputText);
        if (embedConfig != null && inputText != null && urlMatch != null) {
          Promise.resolve(embedConfig.parseUrl(inputText)).then(
            (parseResult) => {
              setEmbedResult(parseResult);
            },
          );
        } else if (embedResult != null) {
          setEmbedResult(null);
        }
      }, 200),
    [embedConfig, embedResult],
  );

  const onClick = () => {
    if (embedResult != null) {
      embedConfig.insertNode(editor, embedResult);
      onClose();
    }
  };

  return (
    <div className="w-full md:w-96 p-4">
      <div className="Input__wrapper mb-4">
        <input
          type="text"
          className="Input__input border-2 border-gray-300 p-2 rounded w-full"
          placeholder={embedConfig.exampleUrl}
          value={text}
          data-test-id={`${embedConfig.type}-embed-modal-url`}
          onChange={(e) => {
            const { value } = e.target;
            setText(value);
            validateText(value);
          }}
        />
      </div>
      <DialogActions>
        <Button
          disabled={!embedResult}
          onClick={onClick}
          data-test-id={`${embedConfig.type}-embed-modal-submit-btn`}>
          Wstaw
        </Button>
      </DialogActions>
    </div>
  );
}

export default function AutoEmbedPlugin(): JSX.Element {
  const [modal, showModal] = useModal();

  const openEmbedModal = (embedConfig: PlaygroundEmbedConfig) => {
    showModal(`Wstaw ${embedConfig.contentName}`, (onClose) => (
      <AutoEmbedDialog embedConfig={embedConfig} onClose={onClose} />
    ));
  };

  const getMenuOptions = (
    activeEmbedConfig: PlaygroundEmbedConfig,
    embedFn: () => void,
    dismissFn: () => void,
  ) => {
    return [
      new AutoEmbedOption('Odrzuć', {
        onSelect: dismissFn,
      }),
      new AutoEmbedOption(`Wstaw ${activeEmbedConfig.contentName}`, {
        onSelect: embedFn,
      }),
    ];
  };

  return (
    <>
      {modal}
      <LexicalAutoEmbedPlugin<PlaygroundEmbedConfig>
        embedConfigs={EmbedConfigs}
        onOpenEmbedModalForConfig={openEmbedModal}
        getMenuOptions={getMenuOptions}
        menuRenderFn={(
          anchorElementRef,
          { selectedIndex, options, selectOptionAndCleanUp, setHighlightedIndex },
        ) =>
          anchorElementRef.current
            ? ReactDOM.createPortal(
                <div
                  className="typeahead-popover auto-embed-menu bg-white shadow-lg rounded-lg"
                  style={{
                    marginLeft: `${Math.max(
                      parseFloat(anchorElementRef.current.style.width) - 200,
                      0,
                    )}px`,
                    width: 200,
                  }}>
                  <AutoEmbedMenu
                    options={options}
                    selectedItemIndex={selectedIndex}
                    onOptionClick={(option: AutoEmbedOption, index: number) => {
                      setHighlightedIndex(index);
                      selectOptionAndCleanUp(option);
                    }}
                    onOptionMouseEnter={(index: number) => {
                      setHighlightedIndex(index);
                    }}
                  />
                </div>,
                anchorElementRef.current,
              )
            : null
        }
      />
    </>
  );
}
