/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';

import {useI18n} from '@/hooks/use-i18n';

import {SHORTCUTS} from './shortcuts';

type ShortcutGroup = {
  titleKey: string;
  items: Array<{labelKey: string; combo: string}>;
};

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    titleKey: 'ed.shortcuts.groupFormatting',
    items: [
      {combo: SHORTCUTS.BOLD, labelKey: 'ed.shortcuts.bold'},
      {combo: SHORTCUTS.ITALIC, labelKey: 'ed.shortcuts.italic'},
      {combo: SHORTCUTS.UNDERLINE, labelKey: 'ed.shortcuts.underline'},
      {combo: SHORTCUTS.STRIKETHROUGH, labelKey: 'ed.shortcuts.strikethrough'},
      {combo: SHORTCUTS.SUBSCRIPT, labelKey: 'ed.shortcuts.subscript'},
      {combo: SHORTCUTS.SUPERSCRIPT, labelKey: 'ed.shortcuts.superscript'},
      {combo: SHORTCUTS.LOWERCASE, labelKey: 'ed.shortcuts.lowercase'},
      {combo: SHORTCUTS.UPPERCASE, labelKey: 'ed.shortcuts.uppercase'},
      {combo: SHORTCUTS.CAPITALIZE, labelKey: 'ed.shortcuts.capitalize'},
      {
        combo: SHORTCUTS.CLEAR_FORMATTING,
        labelKey: 'ed.shortcuts.clearFormatting',
      },
      {
        combo: SHORTCUTS.INCREASE_FONT_SIZE,
        labelKey: 'ed.shortcuts.increaseFontSize',
      },
      {
        combo: SHORTCUTS.DECREASE_FONT_SIZE,
        labelKey: 'ed.shortcuts.decreaseFontSize',
      },
    ],
  },
  {
    titleKey: 'ed.shortcuts.groupBlocks',
    items: [
      {combo: SHORTCUTS.NORMAL, labelKey: 'ed.normalText'},
      {combo: SHORTCUTS.HEADING1, labelKey: 'ed.blockH1'},
      {combo: SHORTCUTS.HEADING2, labelKey: 'ed.blockH2'},
      {combo: SHORTCUTS.HEADING3, labelKey: 'ed.blockH3'},
      {combo: SHORTCUTS.BULLET_LIST, labelKey: 'ed.blockBullet'},
      {combo: SHORTCUTS.NUMBERED_LIST, labelKey: 'ed.blockNumber'},
      {combo: SHORTCUTS.CHECK_LIST, labelKey: 'ed.blockCheck'},
      {combo: SHORTCUTS.QUOTE, labelKey: 'ed.blockQuote'},
      {combo: SHORTCUTS.CODE_BLOCK, labelKey: 'ed.blockCode'},
      {
        combo: SHORTCUTS.INSERT_CODE_BLOCK,
        labelKey: 'ed.shortcuts.insertCodeBlock',
      },
    ],
  },
  {
    titleKey: 'ed.shortcuts.groupAlignment',
    items: [
      {combo: SHORTCUTS.LEFT_ALIGN, labelKey: 'ed.alignLeft'},
      {combo: SHORTCUTS.CENTER_ALIGN, labelKey: 'ed.alignCenter'},
      {combo: SHORTCUTS.RIGHT_ALIGN, labelKey: 'ed.alignRight'},
      {combo: SHORTCUTS.JUSTIFY_ALIGN, labelKey: 'ed.alignJustify'},
      {combo: SHORTCUTS.INDENT, labelKey: 'ed.indent'},
      {combo: SHORTCUTS.OUTDENT, labelKey: 'ed.outdent'},
    ],
  },
  {
    titleKey: 'ed.shortcuts.groupOther',
    items: [
      {combo: SHORTCUTS.INSERT_LINK, labelKey: 'ed.shortcuts.insertLink'},
      {combo: SHORTCUTS.ADD_COMMENT, labelKey: 'ed.shortcuts.addComment'},
      {combo: SHORTCUTS.UNDO, labelKey: 'ed.shortcuts.undo'},
      {combo: SHORTCUTS.REDO, labelKey: 'ed.shortcuts.redo'},
    ],
  },
];

export default function KeyboardShortcutsDialog(): JSX.Element {
  const {t} = useI18n();

  return (
    <div className="keyboard-shortcuts-dialog">
      {SHORTCUT_GROUPS.map((group) => (
        <div className="keyboard-shortcuts-group" key={group.titleKey}>
          <h3 className="keyboard-shortcuts-group-title">
            {t(group.titleKey)}
          </h3>
          <ul className="keyboard-shortcuts-list">
            {group.items.map((item) => (
              <li className="keyboard-shortcuts-item" key={item.labelKey}>
                <span className="keyboard-shortcuts-label">
                  {t(item.labelKey)}
                </span>
                <kbd className="keyboard-shortcuts-combo">{item.combo}</kbd>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
