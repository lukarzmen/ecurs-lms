/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';

import {BlockWithAlignableContents} from '@lexical/react/LexicalBlockWithAlignableContents';
import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import * as React from 'react';

type YouTubeComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  videoID: string;
}>;

function YouTubeComponent({
  className,
  format,
  nodeKey,
  videoID,
}: YouTubeComponentProps) {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}>
      <iframe
      width="100%"
      height="315"
      src={`https://www.youtube-nocookie.com/embed/${videoID}`}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen={true}
      title="YouTube"
      />
    </BlockWithAlignableContents>
  );
}

export type SerializedYouTubeNode = Spread<
  {
    videoID: string;
  },
  SerializedDecoratorBlockNode
>;

function $convertYoutubeElement(
  domNode: HTMLElement,
): null | DOMConversionOutput {
  const videoID = domNode.getAttribute('data-lexical-youtube');
  if (videoID) {
    const node = $createYouTubeNode(videoID);
    return {node};
  }
  return null;
}

export class YouTubeNode extends DecoratorBlockNode {
  __id: string;

  static getType(): string {
    return 'youtube';
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__id, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    const node = $createYouTubeNode(serializedNode.videoID);
    node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      ...super.exportJSON(),
      type: 'youtube',
      version: 1,
      videoID: this.__id,
    };
  }

  constructor(id: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__id = id;
  }

  exportDOM(): DOMExportOutput {
    const url = `https://youtu.be/${this.__id}`;

    // Wrapper ensures we can provide a print/PDF-friendly fallback (link + QR)
    // while still keeping the iframe in exported HTML.
    const container = document.createElement('section');
    container.setAttribute('data-lexical-youtube-block', 'true');
    container.style.border = '1px solid rgba(0,0,0,0.15)';
    container.style.borderRadius = '10px';
    container.style.padding = '12px 14px';
    container.style.margin = '12px 0';

    const header = document.createElement('h3');
    header.textContent = 'Wideo';
    header.style.margin = '0 0 8px 0';
    container.appendChild(header);

    // Embed (may be hidden during print)
    const iframe = document.createElement('iframe');
    iframe.setAttribute('data-lexical-youtube', this.__id);
    iframe.setAttribute('width', '560');
    iframe.setAttribute('height', '315');
    iframe.setAttribute('src', `https://www.youtube-nocookie.com/embed/${this.__id}`);
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    );
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('title', 'YouTube');
    iframe.style.width = '100%';
    iframe.style.maxWidth = '100%';
    iframe.style.display = 'block';
    iframe.style.margin = '0 0 10px 0';
    container.appendChild(iframe);

    // Print/PDF fallback: phone-friendly link + QR placeholder.
    const p = document.createElement('p');
    p.style.margin = '0 0 8px 0';
    p.style.wordBreak = 'break-word';
    const label = document.createElement('span');
    label.textContent = 'Otwórz na telefonie: ';
    const a = document.createElement('a');
    a.href = url;
    a.textContent = url;
    a.target = '_blank';
    a.rel = 'noreferrer noopener';
    p.appendChild(label);
    p.appendChild(a);
    container.appendChild(p);

    const qrWrap = document.createElement('div');
    qrWrap.style.display = 'flex';
    qrWrap.style.gap = '12px';
    qrWrap.style.alignItems = 'center';

    const qrImg = document.createElement('img');
    qrImg.setAttribute('data-youtube-qr', url);
    qrImg.alt = `Kod QR do filmu: ${url}`;
    qrImg.style.width = '140px';
    qrImg.style.height = '140px';
    // Avoid broken image icon when exporting HTML without QR hydration.
    qrImg.style.display = 'none';
    qrImg.style.border = '1px solid rgba(0,0,0,0.12)';
    qrImg.style.borderRadius = '8px';
    qrWrap.appendChild(qrImg);

    const hint = document.createElement('div');
    hint.textContent = 'Zeskanuj kod QR (w PDF) albo wpisz link powyżej.';
    hint.style.fontSize = '0.95em';
    hint.style.opacity = '0.85';
    qrWrap.appendChild(hint);

    container.appendChild(qrWrap);

    return {element: container};
  }

  static importDOM(): DOMConversionMap | null {
    return {
      iframe: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-youtube')) {
          return null;
        }
        return {
          conversion: $convertYoutubeElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getId(): string {
    return this.__id;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined,
  ): string {
    return `https://www.youtube.com/watch?v=${this.__id}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <YouTubeComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        videoID={this.__id}
      />
    );
  }
}

export function $createYouTubeNode(videoID: string): YouTubeNode {
  return new YouTubeNode(videoID);
}

export function $isYouTubeNode(
  node: YouTubeNode | LexicalNode | null | undefined,
): node is YouTubeNode {
  return node instanceof YouTubeNode;
}
