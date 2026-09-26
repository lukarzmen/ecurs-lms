/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import './index.css';

import * as React from 'react';

import {useI18n} from '@/hooks/use-i18n';

import useModal from '../../hooks/useModal';
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog';

export default function KeyboardShortcutsButton(): JSX.Element {
  const {t} = useI18n();
  const [modal, showModal] = useModal();

  return (
    <>
      {modal}
      <button
        type="button"
        className="keyboard-shortcuts-button"
        title={t('ed.shortcuts.title')}
        aria-label={t('ed.shortcuts.title')}
        onClick={() =>
          showModal(t('ed.shortcuts.title'), () => <KeyboardShortcutsDialog />)
        }>
        <i className="keyboard-shortcuts-icon" aria-hidden="true" />
        <span className="keyboard-shortcuts-button-text">
          {t('ed.shortcuts.title')}
        </span>
      </button>
    </>
  );
}
