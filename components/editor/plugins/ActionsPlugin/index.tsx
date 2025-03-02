
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


import './index.css';
import type { LexicalEditor } from 'lexical';
import {
  EmailIcon,
  EmailShareButton,
  FacebookMessengerIcon,
  FacebookMessengerShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterShareButton,
  VKIcon,
  VKShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
} from "react-share";
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import {
  editorStateFromSerializedDocument,
  SerializedDocument,
  serializedDocumentFromEditorState,
} from '@lexical/file';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createTextNode,
  $getRoot,
  $isParagraphNode,
  CLEAR_EDITOR_COMMAND,
  CLEAR_HISTORY_COMMAND,
} from 'lexical';
import { useCallback, useEffect, useState } from 'react';

import { INITIAL_SETTINGS } from '../../appSettings';
import useModal from '../../hooks/useModal';
import Button from '../../ui/Button';
import { docFromHash } from '../../utils/docSerialization';
import { PLAYGROUND_TRANSFORMERS } from '../MarkdownTransformers';
import toast from 'react-hot-toast';
// import {
//   SPEECH_TO_TEXT_COMMAND,
//   SUPPORT_SPEECH_RECOGNITION,
// } from '../SpeechToTextPlugin';

type ActionPluginsSettings = {
  isSpeechToTextEnabled: boolean;
  isSharableEnabled: boolean;
  isReadOnlyEnabled: boolean;
  isConvertToMarkdownEnabled: boolean;
};

export default function ActionsPlugin({
  onSave,
  shouldPreserveNewLinesInMarkdown,
}: {
  isRichText: boolean;
  onSave: (serializedDocument: SerializedDocument) => SaveResult;
  shouldPreserveNewLinesInMarkdown: boolean;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [modal, showModal] = useModal();
  const [hash, setHash] = useState('');
  const [isSpeechToText, setIsSpeechToText] = useState(false);

  const settings: ActionPluginsSettings = {
    isSpeechToTextEnabled: true,
    isSharableEnabled: true,
    isReadOnlyEnabled: true,
    isConvertToMarkdownEnabled: true,
  };

  useEffect(() => {
    if (INITIAL_SETTINGS.isCollab) {
      return;
    }
    docFromHash(window.location.hash).then((doc) => {
      if (doc && doc.source === 'Playground') {
        editor.setEditorState(editorStateFromSerializedDocument(editor, doc));
        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
      }
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(
      () => {
        // If we are in read only mode, send the editor state
        // to server and ask for validation if possible.
        editor.getEditorState().read(() => {
          const root = $getRoot();
          const children = root.getChildren();

          if (children.length > 1) {
            setIsEditorEmpty(false);
          } else {
            if ($isParagraphNode(children[0])) {
              const paragraphChildren = children[0].getChildren();
              setIsEditorEmpty(paragraphChildren.length === 0);
            } else {
              setIsEditorEmpty(false);
            }
          }
        });
      },
    );
  }, [editor, isEditable]);

  const handleMarkdownToggle = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const firstChild = root.getFirstChild();
      if ($isCodeNode(firstChild) && firstChild.getLanguage() === 'markdown') {
        $convertFromMarkdownString(
          firstChild.getTextContent(),
          PLAYGROUND_TRANSFORMERS,
          undefined, // node
          shouldPreserveNewLinesInMarkdown,
        );
      } else {
        const markdown = $convertToMarkdownString(
          PLAYGROUND_TRANSFORMERS,
          undefined, //node
          shouldPreserveNewLinesInMarkdown,
        );
        const codeNode = $createCodeNode('markdown');
        codeNode.append($createTextNode(markdown));
        root.clear().append(codeNode);
        if (markdown.length === 0) {
          codeNode.select();
        }
      }
    });
  }, [editor, shouldPreserveNewLinesInMarkdown]);

  return (
    <div className="actions">
      <button
        className="action-button save"
        onClick={() => {
          SaveEditorState();
        }
        }
        title="Save"
        aria-label="Save editor state">
        <i className="save" />
      </button>
      {settings.isSharableEnabled &&
        <button
          className="action-button share"
          onClick={() => {
            const hash = SaveEditorState();
            showModal('Share editor', (onClose) => (
              <ShareEditorDialog
                hash={hash}
                onClose={onClose}
              />
            ));
          }}

          // shareDoc(
          //   serializedDocumentFromEditorState(editor.getEditorState(), {
          //     source: 'Playground',
          //   }),
          // ).then(
          //   () => showFlashMessage('URL copied to clipboard'),
          //   () => showFlashMessage('URL could not be copied to clipboard'),
          // )

          title="Share"
          aria-label="Share Playground link to current editor state">
          <i className="share" />
        </button>
      }
      
      {/* {SUPPORT_SPEECH_RECOGNITION && settings.isSpeechToTextEnabled && (
        <button
          onClick={() => {
            editor.dispatchCommand(SPEECH_TO_TEXT_COMMAND, !isSpeechToText);
            setIsSpeechToText(!isSpeechToText);
          }}
          className={
            'action-button action-button-mic ' +
            (isSpeechToText ? 'active' : '')
          }
          title="Speech To Text"
          aria-label={`${isSpeechToText ? 'Enable' : 'Disable'
            } speech to text`}>
          <i className="mic" />
        </button> 
      )} */}

      {/* <button
        className="action-button import"
        onClick={() => importFile(editor)}
        title="Import"
        aria-label="Import editor state from JSON">
        <i className="import" />
      </button> */}

      {/* <button
        className="action-button export"
        onClick={() =>
          exportFile(editor, {
            fileName: `Playground ${new Date().toISOString()}`,
            source: 'Playground',
          })
        }
        title="Export"
        aria-label="Export editor state to JSON">
        <i className="export" />
      </button> */}

      <button
        className="action-button clear"
        disabled={isEditorEmpty}
        onClick={() => {
          showModal('Clear editor', (onClose) => (
            <ShowClearDialog editor={editor} onClose={onClose} />
          ));
        }}
        title="Clear"
        aria-label="Clear editor contents">
        <i className="clear" />
      </button>
      {/* <button
        className={`action-button ${!isEditable ? 'unlock' : 'lock'}`}
        onClick={() => {
          // Send latest editor state to commenting validation server
          if (isEditable) {
            sendEditorState(editor);
          }
          editor.setEditable(!editor.isEditable());
        }}
        title="Read-Only Mode"
        aria-label={`${!isEditable ? 'Unlock' : 'Lock'} read-only mode`}>
        <i className={!isEditable ? 'unlock' : 'lock'} />
      </button> */}
      {/* <button
        className="action-button"
        onClick={handleMarkdownToggle}
        title="Convert From Markdown"
        aria-label="Convert from markdown">
        <i className="markdown" />
      </button> */}
      {modal}
    </div>
  );

  function SaveEditorState(): string {
    const serializedDocument: SerializedDocument = serializedDocumentFromEditorState(editor.getEditorState(), {
      source: 'Playground',
    });
    const saveResult = onSave(serializedDocument);
    setHash(saveResult.hash);
    console.log(`Save result: ${saveResult}`);
    return saveResult.hash;
  }
}

function ShareEditorDialog({ hash, onClose }: { hash: string; onClose: () => void }): JSX.Element {
  const shareUrl = `${window.location.origin}/editor/${hash}`;
  const title = 'Masz nowe zadanie!';
  const exampleImage = 'https://via.placeholder.com/150';
  return (
    <div className="flex flex-col items-start border p-4 rounded w-full max-w-lg mx-auto">
      <div className="text-center w-full break-words">
        Share this link: {shareUrl}
        <button
          onClick={() => {
            navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
          }}
          className="ml-2 border border-gray-300 rounded px-2 py-1"
        >
          Copy
        </button>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-4 w-full">
        <FacebookMessengerShareButton
          url={shareUrl}
          appId="580840648168709"
          className="Demo__some-network__share-button"
        >
          <FacebookMessengerIcon size={32} round />
        </FacebookMessengerShareButton>

        <TwitterShareButton
          url={shareUrl}
          title={title}
          className="Demo__some-network__share-button"
        >
          <XIcon size={32} round />
        </TwitterShareButton>

        <TelegramShareButton
          url={shareUrl}
          title={title}
          className="Demo__some-network__share-button"
        >
          <TelegramIcon size={32} round />
        </TelegramShareButton>

        <WhatsappShareButton
          url={shareUrl}
          title={title}
          separator=":: "
          className="Demo__some-network__share-button"
        >
          <WhatsappIcon size={32} round />
        </WhatsappShareButton>

        <VKShareButton
          url={shareUrl}
          image={`${String(window.location)}/${exampleImage}`}
          className="Demo__some-network__share-button"
        >
          <VKIcon size={32} round />
        </VKShareButton>

        <EmailShareButton
          url={shareUrl}
          subject={title}
          body="body"
          className="Demo__some-network__share-button"
        >
          <EmailIcon size={32} round />
        </EmailShareButton>
      </div>
    </div>
  );
}


function ShowClearDialog({
  editor,
  onClose,
}: {
  editor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  return (
    <>
      Are you sure you want to clear the editor?
      <div className="Modal__content">
        <Button
          onClick={() => {
            editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
            editor.focus();
            onClose();
          }}>
          Clear
        </Button>{' '}
        <Button
          onClick={() => {
            editor.focus();
            onClose();
          }}>
          Cancel
        </Button>
      </div>
    </>
  );
}

export interface SaveResult {
  success: boolean;
  hash: string;
}

