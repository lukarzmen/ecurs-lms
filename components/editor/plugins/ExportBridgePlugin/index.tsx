"use client";

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$generateHtmlFromNodes} from '@lexical/html';
import {useCallback, useEffect, useMemo} from 'react';

export type ExportHandlers = {
  exportHtml: () => void;
  exportPdf: () => void;
};

export default function ExportBridgePlugin({
  onReady,
  fileBaseName = 'modul',
}: {
  onReady?: (handlers: ExportHandlers) => void;
  fileBaseName?: string;
}): null {
  const [editor] = useLexicalComposerContext();

  const getHtmlFromEditor = useCallback(() => {
    let html = '';
    editor.getEditorState().read(() => {
      html = $generateHtmlFromNodes(editor, null);
    });
    return html;
  }, [editor]);

  const handlers = useMemo<ExportHandlers>(() => {
    const exportHtml = () => {
      const bodyHtml = getHtmlFromEditor();
      const htmlDocument = `<!doctype html><html lang="pl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Eksport</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;}img{max-width:100%;height:auto;}table{width:100%;margin:12px 0;border:1px solid rgba(0,0,0,0.15);border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden;}th,td{padding:8px 10px;vertical-align:top;border-right:1px solid rgba(0,0,0,0.12);border-bottom:1px solid rgba(0,0,0,0.12);}th:last-child,td:last-child{border-right:0;}tr:last-child td{border-bottom:0;}th{background:rgba(0,0,0,0.06);font-weight:700;text-align:left;}tbody tr:nth-child(even) td{background:rgba(0,0,0,0.02);}</style></head><body>${bodyHtml}</body></html>`;

      const blob = new Blob([htmlDocument], {type: 'text/html;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileBaseName}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    const exportPdf = () => {
      const bodyHtml = getHtmlFromEditor();
      const htmlDocument = `<!doctype html><html lang="pl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Eksport PDF</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;}img{max-width:100%;height:auto;}table{width:100%;margin:12px 0;border:1px solid rgba(0,0,0,0.15);border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden;}th,td{padding:8px 10px;vertical-align:top;border-right:1px solid rgba(0,0,0,0.12);border-bottom:1px solid rgba(0,0,0,0.12);}th:last-child,td:last-child{border-right:0;}tr:last-child td{border-bottom:0;}th{background:rgba(0,0,0,0.06);font-weight:700;text-align:left;}tbody tr:nth-child(even) td{background:rgba(0,0,0,0.02);}@media print{body{margin:0;}}</style></head><body>${bodyHtml}<script>window.addEventListener('load',()=>{setTimeout(()=>{try{window.focus();window.print();}catch(e){}},0)},{once:true});</script></body></html>`;

      const isProbablyMobile =
        (typeof window !== 'undefined' &&
          (window.matchMedia?.('(pointer:coarse)').matches ||
            navigator.maxTouchPoints > 0)) ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isProbablyMobile) {
        const blob = new Blob([htmlDocument], {type: 'text/html;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank');
        if (!w) {
          window.location.href = url;
          return;
        }

        const cleanup = () => {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        };
        w.addEventListener('pagehide', cleanup, {once: true});
        setTimeout(cleanup, 60_000);
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';

      const cleanup = () => {
        try {
          iframe.remove();
        } catch {
          // ignore
        }
      };

      iframe.onload = () => {
        const w = iframe.contentWindow;
        if (!w) {
          cleanup();
          return;
        }

        w.addEventListener('afterprint', cleanup, {once: true});
        setTimeout(cleanup, 60_000);

        w.focus();
        w.print();
      };

      iframe.srcdoc = htmlDocument;
      document.body.appendChild(iframe);
    };

    return {exportHtml, exportPdf};
  }, [fileBaseName, getHtmlFromEditor]);

  useEffect(() => {
    if (onReady) {
      onReady(handlers);
    }
  }, [handlers, onReady]);

  return null;
}
