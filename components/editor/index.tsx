/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// setupEnv must load before App because lexical computes CAN_USE_BEFORE_INPUT
// at import time (disableBeforeInput is used to test legacy events)
// eslint-disable-next-line simple-import-sort/imports
import setupEnv from './setupEnv';
import './index.css';

import * as React from 'react';
import {createRoot} from 'react-dom/client';

import App from './LexicalEditor';
import { SerializedDocument } from '@lexical/file';
import { SaveResult } from './plugins/ActionsPlugin';

if (setupEnv.disableBeforeInput) {
  // vite is really aggressive about tree-shaking, this
  // ensures that the side-effects of importing setupEnv happens
}

// Handle runtime errors
const showErrorOverlay = (err: Event) => {
  const ErrorOverlay = customElements.get('vite-error-overlay');
  if (!ErrorOverlay) {
    return;
  }
  const overlay = new ErrorOverlay(err);
  const body = document.body;
  if (body !== null) {
    body.appendChild(overlay);
  }
};

window.addEventListener('error', showErrorOverlay);
window.addEventListener('unhandledrejection', ({reason}) =>
  showErrorOverlay(reason),
);

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App onSave={function (serializedDocument: SerializedDocument): SaveResult {
      throw new Error('Function not implemented.');
    } } onEditorChange={function (editorState: string): void {
      throw new Error('Function not implemented.');
    } } initialStateJSON={null} isEditable={false} onCompleted={function (): void {
      throw new Error('Function not implemented.');
    } } />
  </React.StrictMode>,
);
