import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalEditor,
} from 'lexical';
import { useEffect, useState } from 'react';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { $createListItemNode, $createListNode, ListType } from '@lexical/list';
import { $createEquationNode } from '../../nodes/EquationNode';
import { useCourseContext } from '../../context/CourseContext';
import { Sparkles, X, Edit2, Loader2 } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import toast from 'react-hot-toast';

export const GENERATE_TEXT_COMMAND: LexicalCommand<LLMPrompt> = createCommand(
  'GENERATE_TEXT_COMMAND',
);

type GenerationPresetId = 'lesson' | 'chapter' | 'content';

export function TextGeneratorDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const { module } = useCourseContext();
  const { t } = useI18n();

  const [generationPreset, setGenerationPreset] = useState<GenerationPresetId>('lesson');
  const [userPrompt, setUserPrompt] = useState('');
  const [userPromptTouched, setUserPromptTouched] = useState(false);
  const [topicOrTitle, setTopicOrTitle] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [systemPromptTouched, setSystemPromptTouched] = useState(false);
  const [isSystemPromptEditable, setIsSystemPromptEditable] = useState(false);
  const [loading, setLoading] = useState(false);

  const generationPresets: Array<{ id: GenerationPresetId; label: string }> = [
    { id: 'lesson', label: t('ed.genLesson') },
    { id: 'chapter', label: t('ed.genChapter') },
    { id: 'content', label: t('ed.genContent') },
  ];

  function formatTemplate(template: string, replacements: Record<string, string>) {
    return Object.entries(replacements).reduce(
      (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
      template,
    );
  }

  function getPromptKey(preset: GenerationPresetId) {
    const hasModule = Boolean(module?.moduleName);
    const hasCourse = Boolean(module?.courseName);

    const base = `ed.genPrompt.${preset}`;

    if (hasModule && hasCourse) return `${base}.moduleCourse`;
    if (hasModule) return `${base}.module`;
    if (hasCourse) return `${base}.course`;
    return `${base}.default`;
  }

  function getSystemPromptKey() {
    const hasModule = Boolean(module?.moduleName);
    const hasCourse = Boolean(module?.courseName);

    if (hasModule && hasCourse) return 'ed.genSystemPrompt.moduleCourse';
    if (hasModule) return 'ed.genSystemPrompt.module';
    if (hasCourse) return 'ed.genSystemPrompt.course';
    return 'ed.genSystemPrompt.default';
  }

  const promptReplacements = {
    module: module?.moduleName ?? '',
    course: module?.courseName ?? '',
  };

  const autoUserPrompt = formatTemplate(t(getPromptKey(generationPreset)), promptReplacements);
  const autoSystemPrompt = formatTemplate(t(getSystemPromptKey()), promptReplacements);
  const effectiveUserPrompt = userPromptTouched ? userPrompt : autoUserPrompt;
  const effectiveSystemPrompt = systemPromptTouched ? systemPrompt : autoSystemPrompt;

  const handleSubmit = () => {
    const trimmedUserPrompt = effectiveUserPrompt.trim();
    const trimmedTopicOrTitle = topicOrTitle.trim();

    if (!trimmedUserPrompt) {
      toast.error(t('ed.genPromptEmpty'));
      return;
    }

    if ((generationPreset === 'chapter' || generationPreset === 'content') && !trimmedTopicOrTitle) {
      toast.error(
        generationPreset === 'chapter'
          ? t('ed.genTopicChapterReq')
          : t('ed.genTopicContentReq'),
      );
      return;
    }

    const composedUserPrompt =
      generationPreset === 'chapter' || generationPreset === 'content'
        ? [
            trimmedUserPrompt,
            `\n\n${generationPreset === 'chapter' ? t('ed.genTopicLabel') : t('ed.genTopic')}: ${trimmedTopicOrTitle}`,
          ].join('')
        : trimmedUserPrompt;

    const payload: LLMPrompt = {
      userPrompt: composedUserPrompt,
      systemPrompt: effectiveSystemPrompt.trim(),
    };

    setLoading(true);
    activeEditor.dispatchCommand(GENERATE_TEXT_COMMAND, payload);
  };

  useEffect(() => {
    if (!loading) return;

    const handleLoadingComplete = () => {
      setLoading(false);
      onClose();
    };

    document.addEventListener('generateTextComplete', handleLoadingComplete);

    return () => {
      document.removeEventListener('generateTextComplete', handleLoadingComplete);
    };
  }, [loading, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full relative overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-foreground">{t('ed.genTitle')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('ed.genModeLabel')}
            </label>
            <select
              className="w-full px-3 py-2 border-2 border-border rounded-md bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              value={generationPreset}
              onChange={(e) => {
                setGenerationPreset(e.target.value as GenerationPresetId);
                setUserPromptTouched(false);
                setSystemPromptTouched(false);
              }}
              disabled={loading}
            >
              {generationPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {(generationPreset === 'chapter' || generationPreset === 'content') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {generationPreset === 'chapter' ? t('ed.genTopicLabel') : t('ed.genTopic')}
              </label>
              <input
                className="w-full px-3 py-2 border-2 border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder={
                  generationPreset === 'chapter'
                    ? t('ed.genTopicChapterPlaceholder')
                    : t('ed.genTopicContentPlaceholder')
                }
                value={topicOrTitle}
                onChange={(e) => setTopicOrTitle(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('ed.genPromptLabel')}
            </label>
            <textarea
              className="w-full px-3 py-2 border-2 border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all resize-none"
              rows={6}
              placeholder={t('ed.genPromptPlaceholder')}
              value={effectiveUserPrompt}
              onChange={(e) => {
                setUserPromptTouched(true);
                setUserPrompt(e.target.value);
              }}
              disabled={loading}
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-foreground mb-2">
              <span>{t('ed.genSystemLabel')}</span>
              <button
                onClick={() => setIsSystemPromptEditable(!isSystemPromptEditable)}
                className={`p-1 rounded-md transition-all ${
                  isSystemPromptEditable ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
                }`}
                disabled={loading}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </label>
            <textarea
              className="w-full px-3 py-2 border-2 border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
              value={effectiveSystemPrompt}
              onChange={(e) => {
                setSystemPromptTouched(true);
                setSystemPrompt(e.target.value);
              }}
              disabled={!isSystemPromptEditable || loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">{t('ed.genGenerating')}</span>
              </div>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors font-medium text-sm"
                >
                  {t('ed.cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={effectiveUserPrompt.trim() === ''}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {t('ed.genGenerate')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TextGeneratorPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<LLMPrompt>(
      GENERATE_TEXT_COMMAND,
      (payload) => {
        fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
          .then((response) => response.text())
          .then((response) => {
            editor.update(() => {
              const root = $getRoot();

              const appendFormattedText = (
                container: ReturnType<typeof $createParagraphNode>,
                text: string,
              ) => {
                const parts = text.split(/(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*)/g);
                parts.forEach((part) => {
                  if (part.startsWith('$') && part.endsWith('$') && !part.startsWith('$$')) {
                    const equation = part.slice(1, -1);
                    const equationNode = $createEquationNode(equation, true);
                    container.append(equationNode);
                  } else if (part.startsWith('`') && part.endsWith('`')) {
                    const codeText = part.slice(1, -1);
                    const textNode = $createTextNode(codeText);
                    textNode.setFormat('code');
                    container.append(textNode);
                  } else if (part.startsWith('**') && part.endsWith('**')) {
                    const boldText = part.slice(2, -2);
                    const textNode = $createTextNode(boldText);
                    textNode.setFormat('bold');
                    container.append(textNode);
                  } else {
                    container.append($createTextNode(part));
                  }
                });
              };

              const cleanedResponse = response.replace(/^#####\s*/gm, '');
              const lines = cleanedResponse.split('\n').filter((line) => line.trim() !== '---');

              let inCodeBlock = false;
              let codeBlockContent = '';
              let inEquationBlock = false;
              let equationBlockContent = '';

              let activeList:
                | {
                    type: ListType;
                    node: ReturnType<typeof $createListNode>;
                  }
                | null = null;

              lines.forEach((line) => {
                if (line.trim().startsWith('$$')) {
                  if (inEquationBlock) {
                    inEquationBlock = false;
                    const equationNode = $createEquationNode(equationBlockContent.trim(), false);
                    root.append(equationNode);
                    equationBlockContent = '';
                  } else {
                    activeList = null;
                    inEquationBlock = true;
                    equationBlockContent = '';
                  }
                  return;
                }

                if (inEquationBlock) {
                  equationBlockContent += (equationBlockContent ? '\n' : '') + line;
                  return;
                }

                if (line.trim().startsWith('```')) {
                  if (inCodeBlock) {
                    inCodeBlock = false;
                    const codeNode = $createCodeNode();
                    codeNode.append($createTextNode(codeBlockContent.trim()));
                    root.append(codeNode);
                    codeBlockContent = '';
                  } else {
                    activeList = null;
                    inCodeBlock = true;
                    codeBlockContent = '';
                  }
                  return;
                }

                if (inCodeBlock) {
                  codeBlockContent += (codeBlockContent ? '\n' : '') + line;
                  return;
                }

                const bulletMatch = line.match(/^\s*[-*+]\s+(.*)$/);

                if (bulletMatch) {
                  const listType: ListType = 'bullet';
                  const itemText = (bulletMatch?.[1] ?? '').trimEnd();

                  if (!activeList || activeList.type !== listType) {
                    const listNode = $createListNode(listType);
                    root.append(listNode);
                    activeList = { type: listType, node: listNode };
                  }

                  const listItemNode = $createListItemNode();
                  const paragraphNode = $createParagraphNode();
                  appendFormattedText(paragraphNode, itemText);
                  listItemNode.append(paragraphNode);
                  activeList.node.append(listItemNode);
                  return;
                }

                activeList = null;

                if (line.trim().startsWith('#### ')) {
                  const headingText = line.replace(/^####\s*/, '');
                  const headingNode = $createHeadingNode('h3');
                  headingNode.append($createTextNode(headingText));
                  root.append(headingNode);
                  return;
                }

                if (line.trim().startsWith('# ')) {
                  const headingText = line.replace(/^#\s*/, '');
                  const headingNode = $createHeadingNode('h1');
                  headingNode.append($createTextNode(headingText));
                  root.append(headingNode);
                  return;
                }

                if (line.trim().startsWith('## ')) {
                  const headingText = line.replace(/^##\s*/, '');
                  const headingNode = $createHeadingNode('h2');
                  headingNode.append($createTextNode(headingText));
                  root.append(headingNode);
                  return;
                }

                if (line.trim().startsWith('### ')) {
                  const headingText = line.replace(/^###\s*/, '');
                  const headingNode = $createHeadingNode('h3');
                  headingNode.append($createTextNode(headingText));
                  root.append(headingNode);
                  return;
                }

                const paragraphNode = $createParagraphNode();
                appendFormattedText(paragraphNode, line);
                root.append(paragraphNode);
              });
            });

            const event = new Event('generateTextComplete');
            document.dispatchEvent(event);
          });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
