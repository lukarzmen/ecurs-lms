/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$wrapNodeInElement, mergeRegister} from '@lexical/utils';
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  LexicalCommand,
  LexicalEditor,
} from 'lexical';
import {useEffect, useRef, useState} from 'react';
import * as React from 'react';
import {CAN_USE_DOM} from '../../shared/canUseDOM';

import {
  $createImageNode,
  $isImageNode,
  ImageNode,
  ImagePayload,
} from '../../nodes/ImageNode';
import Button from '../../ui/Button';
import {DialogActions, DialogButtonsList} from '../../ui/Dialog';
import FileInput from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';

// Image resizing configuration
const MAX_IMAGE_WIDTH = 1200; // Maximum width in pixels
const IMAGE_QUALITY = 0.8; // JPEG quality (0.1 to 1.0)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export type InsertImagePayload = Readonly<ImagePayload>;

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || window).getSelection() : null;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand('INSERT_IMAGE_COMMAND');

export function InsertImageUriDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void;
}) {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const isDisabled = src === '';

  return (
    <>
      <TextInput
        label="Image URL"
        placeholder="i.e. https://source.unsplash.com/random"
        onChange={setSrc}
        value={src}
        data-test-id="image-modal-url-input"
      />
      <TextInput
        label="Alt Text"
        placeholder="Random unsplash image"
        onChange={setAltText}
        value={altText}
        data-test-id="image-modal-alt-text-input"
      />
      <DialogActions>
        <Button
          data-test-id="image-modal-confirm-btn"
          disabled={isDisabled}
          onClick={() => onClick({altText, src})}>
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

// Utility function to resize image and convert to base64
const resizeImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions
        const { width, height } = img;
        const aspectRatio = height / width;
        
        let newWidth = width;
        let newHeight = height;
        
        // Only resize if image is larger than maxWidth
        if (width > maxWidth) {
          newWidth = maxWidth;
          newHeight = maxWidth * aspectRatio;
        }
        
        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        if (ctx) {
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw resized image
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          // Determine output format - use JPEG for photos, PNG for images with transparency
          const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const outputQuality = outputFormat === 'image/jpeg' ? quality : undefined;
          
          // Convert to base64 with specified quality
          const resizedBase64 = canvas.toDataURL(outputFormat, outputQuality);
          
          // Clean up
          URL.revokeObjectURL(img.src);
          
          resolve(resizedBase64);
        } else {
          reject(new Error('Could not get canvas context'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    // Load the image
    img.src = URL.createObjectURL(file);
  });
};

export function InsertImageUploadedDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void;
}) {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isDisabled = src === '' || isProcessing;

  const loadImage = (files: FileList | null) => {
    if (files !== null && files[0]) {
      const file = files[0];
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`Plik jest za duży. Maksymalny rozmiar to ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
        return;
      }
      
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert('Proszę wybrać plik obrazu.');
        return;
      }
      
      setIsProcessing(true);
      
      resizeImage(file, MAX_IMAGE_WIDTH, IMAGE_QUALITY)
        .then((resizedBase64: string) => {
          setSrc(resizedBase64);
          setIsProcessing(false);
        })
        .catch((error: Error) => {
          console.error('Error resizing image:', error);
          setIsProcessing(false);
          // Fallback to original file
          const reader = new FileReader();
          reader.onload = function () {
            if (typeof reader.result === 'string') {
              setSrc(reader.result);
            }
          };
          reader.readAsDataURL(file);
        });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 items-center">
      <label className="text-sm font-medium text-gray-700">
      Wybierz obraz
      </label>
      <FileInput
      label=""
      onChange={loadImage}
      accept="image/*"
      data-test-id="image-modal-file-upload"
      />
      <label className="text-sm font-medium text-gray-700">
      Tekst alternatywny
      </label>
      <TextInput
      label=""
      placeholder="Opisowy tekst alternatywny"
      onChange={setAltText}
      value={altText}
      data-test-id="image-modal-alt-text-input"
      />
      {src && (
        <>
          <label className="text-sm font-medium text-gray-700">
            Podgląd
          </label>
          <div className="max-w-xs">
            {/* Using img for base64 preview - Next.js Image component doesn't work with data URLs */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={src} 
              alt="Podgląd obrazu" 
              className="max-w-full h-auto rounded border"
            />
          </div>
        </>
      )}
      <DialogActions>
      <Button
        data-test-id="image-modal-file-upload-btn"
        disabled={isDisabled}
        onClick={() => onClick({ altText, src })}
      >
        {isProcessing ? 'Przetwarzanie...' : 'Potwierdź'}
      </Button>
      </DialogActions>
    </div>
  );
}

export function InsertImageDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [mode, setMode] = useState<null | 'url' | 'file'>(null);
  const hasModifier = useRef(false);

  useEffect(() => {
    hasModifier.current = false;
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey;
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [activeEditor]);

  const onClick = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    onClose();
  };

  return (
    <>
      {!mode && (
        <DialogButtonsList>
          <Button
            data-test-id="image-modal-option-url"
            onClick={() => setMode('url')}>
            URL
          </Button>
          <Button
            data-test-id="image-modal-option-file"
            onClick={() => setMode('file')}>
            Plik
          </Button>
        </DialogButtonsList>
      )}
      {mode === 'url' && <InsertImageUriDialogBody onClick={onClick} />}
      {mode === 'file' && <InsertImageUploadedDialogBody onClick={onClick} />}
    </>
  );
}

export default function ImagesPlugin({
  captionsEnabled,
}: {
  captionsEnabled?: boolean;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagesPlugin: ImageNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload);
          $insertNodes([imageNode]);
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return $onDragStart(event);
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return $onDragover(event);
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return $onDrop(event, editor);
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [captionsEnabled, editor]);

  return null;
}

const TRANSPARENT_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  let img: HTMLImageElement | null = null;
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    img = document.createElement('img');
    img.src = TRANSPARENT_IMAGE;
  }


function $onDragStart(event: DragEvent): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  dataTransfer.setData('text/plain', '_');
  if (img) {
    dataTransfer.setDragImage(img, 0, 0);
  }
  dataTransfer.setData(
    'application/x-lexical-drag',
    JSON.stringify({
      data: {
        altText: node.__altText,
        caption: node.__caption,
        height: node.__height,
        key: node.getKey(),
        maxWidth: node.__maxWidth,
        showCaption: node.__showCaption,
        src: node.__src,
        width: node.__width,
      },
      type: 'image',
    }),
  );

  return true;
}

function $onDragover(event: DragEvent): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropImage(event)) {
    event.preventDefault();
  }
  return true;
}

function $onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragImageData(event);
  if (!data) {
    return false;
  }
  event.preventDefault();
  if (canDropImage(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
  }
  return true;
}

function $getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isImageNode(node) ? node : null;
}

function getDragImageData(event: DragEvent): null | InsertImagePayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
  if (!dragData) {
    return null;
  }
  const {type, data} = JSON.parse(dragData);
  if (type !== 'image') {
    return null;
  }

  return data;
}

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest('code, span.editor-image') &&
    target.parentElement &&
    target.parentElement.closest('div.ContentEditable__root')
  );
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range;
  const target = event.target as null | Element | Document;
  const targetWindow =
    target == null
      ? null
      : target.nodeType === 9
      ? (target as Document).defaultView
      : (target as Element).ownerDocument.defaultView;
  const domSelection = getDOMSelection(targetWindow);
  if(document !== undefined){
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(event.clientX, event.clientY);
    } else if (event.rangeParent && domSelection !== null) {
      domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
      range = domSelection.getRangeAt(0);
    } else {
      throw Error(`Cannot get the selection when dragging`);
    }
  }
  return range;
}
