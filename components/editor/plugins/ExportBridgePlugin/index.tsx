"use client";

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$generateHtmlFromNodes} from '@lexical/html';
import {useCallback, useEffect, useMemo} from 'react';

export type ExportHandlers = {
  exportHtml: (courseName?: string, moduleName?: string) => void;
  exportPdf: (courseName?: string, moduleName?: string) => void;
};

export default function ExportBridgePlugin({
  onReady,
  fileBaseName = 'modul',
}: {
  onReady?: (handlers: ExportHandlers) => void;
  fileBaseName?: string;
}): null {
  const [editor] = useLexicalComposerContext();

  const generateFileName = useCallback((courseName?: string, moduleName?: string) => {
    if (courseName && moduleName) {
      const sanitize = (str: string) => str.replace(/[^a-z0-9_-]/gi, '_');
      return `${sanitize(courseName)}_${sanitize(moduleName)}`;
    }
    return fileBaseName;
  }, [fileBaseName]);

  const getHtmlFromEditor = useCallback(() => {
    let html = '';
    editor.getEditorState().read(() => {
      html = $generateHtmlFromNodes(editor, null);
    });
    return html;
  }, [editor]);

  const handlers = useMemo<ExportHandlers>(() => {
    const exportHtml = (courseName?: string, moduleName?: string) => {
      void (async () => {
        const bodyHtml = getHtmlFromEditor();
        const fileName = generateFileName(courseName, moduleName);

        const wrapper = document.createElement('div');
        wrapper.innerHTML = bodyHtml;

        const qrImgs = Array.from(
          wrapper.querySelectorAll('img[data-youtube-qr]'),
        ) as HTMLImageElement[];

        if (qrImgs.length > 0) {
          try {
            const QRCodeModule = await import('qrcode');
            const toDataURL: undefined | ((text: string, opts?: any) => Promise<string>) =
              (QRCodeModule as any).toDataURL ??
              (QRCodeModule as any).default?.toDataURL;

            if (typeof toDataURL === 'function') {
              await Promise.all(
                qrImgs.map(async (img) => {
                  const url = img.getAttribute('data-youtube-qr');
                  if (!url) return;
                  try {
                    const dataUrl = await toDataURL(url, {
                      width: 256,
                      margin: 1,
                    });
                    img.src = dataUrl;
                    img.style.display = 'block';
                  } catch {
                    // ignore
                  }
                }),
              );
            }
          } catch {
            // ignore
          }
        }

        const processedHtml = wrapper.innerHTML;
        const htmlDocument = `<!doctype html><html lang="pl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${fileName}</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;}img{max-width:100%;height:auto;}table{width:100%;margin:12px 0;border:1px solid rgba(0,0,0,0.15);border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden;}th,td{padding:8px 10px;vertical-align:top;border-right:1px solid rgba(0,0,0,0.12);border-bottom:1px solid rgba(0,0,0,0.12);}th:last-child,td:last-child{border-right:0;}tr:last-child td{border-bottom:0;}th{background:rgba(0,0,0,0.06);font-weight:700;text-align:left;}tbody tr:nth-child(even) td{background:rgba(0,0,0,0.02);}</style></head><body>${processedHtml}</body></html>`;

        const blob = new Blob([htmlDocument], {type: 'text/html;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })();
    };

    const exportPdf = (courseName?: string, moduleName?: string) => {
      void (async () => {
        const bodyHtml = getHtmlFromEditor();
        const fileName = generateFileName(courseName, moduleName);

        const wrapper = document.createElement('div');
        wrapper.innerHTML = bodyHtml;

        const qrImgs = Array.from(
          wrapper.querySelectorAll('img[data-youtube-qr]'),
        ) as HTMLImageElement[];

        if (qrImgs.length > 0) {
          try {
            const QRCodeModule = await import('qrcode');
            const toDataURL: undefined | ((text: string, opts?: any) => Promise<string>) =
              (QRCodeModule as any).toDataURL ??
              (QRCodeModule as any).default?.toDataURL;

            if (typeof toDataURL !== 'function') {
              throw new Error('qrcode: toDataURL not found');
            }
            await Promise.all(
              qrImgs.map(async (img) => {
                const url = img.getAttribute('data-youtube-qr');
                if (!url) return;
                try {
                  const dataUrl = await toDataURL(url, {
                    width: 256,
                    margin: 1,
                  });
                  img.src = dataUrl;
                  img.style.display = 'block';
                } catch {
                  // ignore
                }
              }),
            );
          } catch {
            // ignore
          }
        }

        const iframes = Array.from(
          wrapper.querySelectorAll('iframe[data-lexical-youtube]'),
        ) as HTMLIFrameElement[];
        for (const iframe of iframes) {
          iframe.style.display = 'none';
          iframe.style.height = '0';
        }

        const processedHtml = wrapper.innerHTML;

        const htmlDocument = `<!doctype html><html lang="pl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${fileName}</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;}img{max-width:100%;height:auto;}table{width:100%;margin:12px 0;border:1px solid rgba(0,0,0,0.15);border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden;}th,td{padding:8px 10px;vertical-align:top;border-right:1px solid rgba(0,0,0,0.12);border-bottom:1px solid rgba(0,0,0,0.12);}th:last-child,td:last-child{border-right:0;}tr:last-child td{border-bottom:0;}th{background:rgba(0,0,0,0.06);font-weight:700;text-align:left;}tbody tr:nth-child(even) td{background:rgba(0,0,0,0.02);}@media print{body{margin:0;}iframe[data-lexical-youtube]{display:none!important;}}</style></head><body>${processedHtml}<script>window.addEventListener('load',()=>{setTimeout(()=>{try{window.focus();window.print();}catch(e){}},0)},{once:true});</script></body></html>`;

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
      })();
    };

    return {exportHtml, exportPdf};
  }, [generateFileName, getHtmlFromEditor]);

  useEffect(() => {
    if (onReady) {
      onReady(handlers);
    }
  }, [handlers, onReady]);

  return null;
}
