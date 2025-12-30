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
import * as React from 'react';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { $createListItemNode, $createListNode, ListType } from '@lexical/list';
import { useCourseContext } from '../../context/CourseContext';
import { Sparkles, X, Edit2, Loader2 } from 'lucide-react';

import ProgressSpinner from './ProgressComponent';
import toast from 'react-hot-toast';

export const GENERATE_TEXT_COMMAND: LexicalCommand<LLMPrompt> = createCommand(
  'GENERATE_TEXT_COMMAND',
);

export function TextGeneratorDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const { module } = useCourseContext();

  type GenerationPresetId = 'lesson' | 'chapter' | 'content';

  const generationPresets: Array<{ id: GenerationPresetId; label: string }> = [
    { id: 'lesson', label: 'Lekcja (domyślnie)' },
    { id: 'chapter', label: 'Rozdział (tylko jeden)' },
    { id: 'content', label: 'Tekst o treści' },
  ];
  
  // Create context-aware placeholders and prompts
  const getDefaultUserPrompt = React.useCallback(
    (preset: GenerationPresetId) => {
      const modulePart = module?.moduleName ? `"${module.moduleName}"` : '';
      const coursePart = module?.courseName ? ` dla kursu "${module.courseName}"` : '';

      if (preset === 'chapter') {
        if (module?.moduleName) {
          return [
            `Wygeneruj tylko jeden rozdział do lekcji ${modulePart}${coursePart}.`,
            '',
            'Wymagania (Markdown):',
            '- zacznij od nagłówka poziomu 2: `## Tytuł rozdziału` (użyj tytułu/tematu z pola „Temat / tytuł”)',
            '- 3–6 akapitów wyjaśniających temat przystępnie, „do ucznia”',
            '- 1 lista punktowana lub numerowana (jeśli pasuje)',
            '- 1 krótki przykład lub ciekawostka',
            '- na końcu 1 krótkie zadanie/pytanie kontrolne',
            '',
            'Zwróć wyłącznie treść tego rozdziału (bez `# Lekcja`, bez spisu treści, bez wstępu o planie).',
          ].join('\n');
        }
        return [
          'Wygeneruj tylko jeden rozdział (część lekcji).',
          '',
          'Wymagania (Markdown):',
          '- zacznij od nagłówka poziomu 2: `## Tytuł rozdziału` (użyj tytułu/tematu z pola „Temat / tytuł”)',
          '- 3–6 akapitów wyjaśniających temat przystępnie, „do ucznia”',
          '- 1 lista punktowana lub numerowana (jeśli pasuje)',
          '- na końcu 1 krótkie zadanie/pytanie kontrolne',
          '',
          'Zwróć wyłącznie treść tego rozdziału (bez `# Lekcja`, bez spisu treści).',
        ].join('\n');
      }

      if (preset === 'content') {
        if (module?.moduleName && module?.courseName) {
          return [
            `Napisz spójny, angażujący tekst na temat powiązany z lekcją ${modulePart} w kursie "${module.courseName}".`,
            '',
            'Wymagania (Markdown):',
            '- użyj nagłówków `##` dla 2–4 sekcji',
            '- dodaj przykłady i krótkie odniesienia do praktyki',
            '- zakończ krótkim podsumowaniem (3–5 punktów)',
          ].join('\n');
        }
        if (module?.moduleName) {
          return [
            `Napisz spójny, angażujący tekst na temat powiązany z lekcją ${modulePart}.`,
            '',
            'Wymagania (Markdown):',
            '- użyj nagłówków `##` dla 2–4 sekcji',
            '- dodaj przykłady i krótkie odniesienia do praktyki',
            '- zakończ krótkim podsumowaniem (3–5 punktów)',
          ].join('\n');
        }
        return [
          'Napisz spójny, angażujący tekst na temat podany w polu „Temat”.',
          '',
          'Wymagania (Markdown):',
          '- użyj nagłówków `##` dla 2–4 sekcji',
          '- dodaj przykłady',
          '- zakończ krótkim podsumowaniem (3–5 punktów)',
        ].join('\n');
      }

      // lesson (default) — keep current behavior
      if (module?.courseName && module?.moduleName) {
        return `Wygeneruj treść lekcji "${module.moduleName}" dla kursu "${module.courseName}". Uwzględnij:`;
      } else if (module?.moduleName) {
        return `Wygeneruj treść lekcji "${module.moduleName}". Uwzględnij:`;
      } else if (module?.courseName) {
        return `Wygeneruj treść lekcji dla kursu "${module.courseName}". Uwzględnij:`;
      }
      return 'Wygeneruj treść lekcji. Uwzględnij:';
    },
    [module?.courseName, module?.moduleName],
  );
  
  const getContextualSystemPrompt = React.useCallback(() => {
    let basePrompt = "Jesteś kreatywnym asystentem AI, który tworzy angażujące, opisowe i naturalnie brzmiące treści edukacyjne skierowane bezpośrednio do ucznia. Pisz do ucznia w 2. osobie (\"Ty\"), w formie opowieści: mów czego się nauczysz i co poznasz, oraz po co to jest przydatne. Unikaj formalnego, sztywnego stylu oraz konspektów dla nauczycieli. Pisz żywo i przystępnie: używaj obrazowych opisów, przykładów i krótkich zadań lub pytań pobudzających do myślenia. Materiały mają interesować i angażować czytelnika — dodawaj ciekawostki. Odpowiedzi formatuj w czystym Markdown (nagłówki, listy, pogrubienia itp.) i nie dodawaj instrukcji ani meta‑komentarzy. Nie kończ tekstu pytaniami do autora/użytkownika typu „Czy chcesz, żebym…”, nie zadawaj takich pytań i nie kończ ofertą dalszej pomocy. Jeśli tworzysz słowniczek, to ma to być CZYSTY TEKST (bez punktorów, bez numerowania, bez emoji, bez dodatkowych informacji typu rodzaj gramatyczny/wymowa/komentarze). Każda pozycja w nowej linii dokładnie w formacie: `definicja - tłumaczenie`. Jeśli generujesz zwroty/zdania z tłumaczeniami, zastosuj identyczny format CZYSTEGO TEKSTU: jedna linia na zwrot, dokładnie `zwrot - tłumaczenie`. Bez punktorów/numerowania i bez separatora „—” (używaj wyłącznie zwykłego myślnika `-`).";
    
    if (module?.courseName && module?.moduleName) {
      basePrompt += ` Tworzysz treści dla modułu "${module.moduleName}" w kursie "${module.courseName}". Dostosuj poziom trudności i styl do tego kontekstu edukacyjnego.`;
    } else if (module?.moduleName) {
      basePrompt += ` Tworzysz treści dla modułu "${module.moduleName}". Dostosuj poziom trudności i styl do tego kontekstu edukacyjnego.`;
    } else if (module?.courseName) {
      basePrompt += ` Tworzysz treści dla kursu "${module.courseName}". Dostosuj poziom trudności i styl do tego kontekstu edukacyjnego.`;
    }
    
    return basePrompt;
  }, [module?.courseName, module?.moduleName]);

  const [generationPreset, setGenerationPreset] = useState<GenerationPresetId>('lesson');
  const [userPrompt, setUserPrompt] = useState("");
  const [lastAutoUserPrompt, setLastAutoUserPrompt] = useState<string>("");
  const [topicOrTitle, setTopicOrTitle] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSystemPromptEditable, setIsSystemPromptEditable] = useState(false);
  const [loading, setLoading] = useState(false);

  // Update prompts when course context becomes available
  useEffect(() => {
    const nextAutoUserPrompt = getDefaultUserPrompt(generationPreset);
    setLastAutoUserPrompt(nextAutoUserPrompt);
    setUserPrompt((prev) => {
      // Avoid clobbering user edits: only auto-update if user hasn't diverged from the last auto prompt.
      if (!prev || prev === lastAutoUserPrompt) return nextAutoUserPrompt;
      return prev;
    });
    setSystemPrompt(getContextualSystemPrompt());
  }, [module, generationPreset, getDefaultUserPrompt, getContextualSystemPrompt, lastAutoUserPrompt]);

  const handleSubmit = () => {
    const trimmedUserPrompt = userPrompt.trim();
    const trimmedTopicOrTitle = topicOrTitle.trim();

    if (!trimmedUserPrompt) {
      toast.error("Polecenie użytkownika nie może być puste.");
      return;
    }

    if ((generationPreset === 'chapter' || generationPreset === 'content') && !trimmedTopicOrTitle) {
      toast.error(
        generationPreset === 'chapter'
          ? 'Podaj temat lub tytuł rozdziału.'
          : 'Podaj temat, na który mam napisać tekst.',
      );
      return;
    }

    const composedUserPrompt =
      generationPreset === 'chapter' || generationPreset === 'content'
        ? [
            trimmedUserPrompt,
            `\n\n${generationPreset === 'chapter' ? 'Temat / tytuł rozdziału' : 'Temat'}: ${trimmedTopicOrTitle}`,
          ].join('')
        : trimmedUserPrompt;

    const payload: LLMPrompt = { userPrompt: composedUserPrompt, systemPrompt: systemPrompt.trim() };
      setLoading(true);
      activeEditor.dispatchCommand(GENERATE_TEXT_COMMAND, payload);
  };

  useEffect(() => {
    if (!loading) return;
    const handleLoadingComplete = () => {
      setLoading(false);
      onClose();
    };

    // Listen for a custom event to signal loading is complete
    document.addEventListener("generateTextComplete", handleLoadingComplete);

    return () => {
      document.removeEventListener(
        "generateTextComplete",
        handleLoadingComplete
      );
    };
  }, [loading, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-foreground">Generator treści</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tryb generowania
            </label>
            <select
              className="w-full px-3 py-2 border-2 border-border rounded-md bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              value={generationPreset}
              onChange={(e) => setGenerationPreset(e.target.value as GenerationPresetId)}
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
                {generationPreset === 'chapter' ? 'Temat / tytuł' : 'Temat'}
              </label>
              <input
                className="w-full px-3 py-2 border-2 border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder={
                  generationPreset === 'chapter'
                    ? 'Np. „Wprowadzenie do ułamków”'
                    : 'Np. „Jak działa fotosynteza?”'
                }
                value={topicOrTitle}
                onChange={(e) => setTopicOrTitle(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Co chcesz wygenerować?
            </label>
            <textarea
              className="w-full px-3 py-2 border-2 border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all resize-none"
              rows={6}
              placeholder="Edytuj polecenie lub dodaj szczegóły dotyczące treści, którą chcesz wygenerować..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium text-foreground mb-2">
              <span>Informacje systemowe (kontekstowe) dla AI</span>
              <button
                onClick={() => setIsSystemPromptEditable(!isSystemPromptEditable)}
                className={`p-1 rounded-md transition-all ${
                  isSystemPromptEditable
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
                disabled={loading}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </label>
            <textarea
              className="w-full px-3 py-2 border-2 border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={!isSystemPromptEditable || loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Generuję...</span>
              </div>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors font-medium text-sm"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={userPrompt.trim() === ""}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generuj
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
            console.log('Received response:', response);
            editor.update(() => {
              const root = $getRoot();

              const appendFormattedText = (
                container: ReturnType<typeof $createParagraphNode>,
                text: string,
              ) => {
                const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
                parts.forEach((part) => {
                  if (part.startsWith('`') && part.endsWith('`')) {
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

              // Split response into lines
              const cleanedResponse = response.replace(/^#####\s*/gm, "");
              const lines = cleanedResponse.split('\n').filter(line => line.trim() !== "---");
              
              let inCodeBlock = false;
              let codeBlockContent = '';

              let activeList:
                | {
                    type: ListType;
                    node: ReturnType<typeof $createListNode>;
                  }
                | null = null;
              
              lines.forEach((line) => {
                // Handle code blocks (```)
                if (line.trim().startsWith("```")) {
                  if (inCodeBlock) {
                    // End of code block - create proper CodeNode
                    inCodeBlock = false;
                    const codeNode = $createCodeNode();
                    codeNode.append($createTextNode(codeBlockContent.trim()));
                    root.append(codeNode);
                    codeBlockContent = '';
                  } else {
                    // Start of code block
                    activeList = null;
                    inCodeBlock = true;
                    codeBlockContent = '';
                  }
                  return;
                }
                
                // If we're in a code block, accumulate content
                if (inCodeBlock) {
                  codeBlockContent += (codeBlockContent ? '\n' : '') + line;
                  return;
                }

                const bulletMatch = line.match(/^\s*[-*+]\s+(.*)$/);

                // IMPORTANT: Do NOT convert ordered lists like "1. 2. 3." into list nodes.
                // Lexical will renumber from 1 and it can cause node misalignment.
                // We only convert bullet lists to list nodes.
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

                // Any non-list line ends an active list.
                activeList = null;
                
                // Heading 4: ####
                if (line.trim().startsWith("#### ")) {
                  const headingText = line.replace(/^####\s*/, "");
                  const headingNode = $createHeadingNode('h3');
                  headingNode.append($createTextNode(headingText));
                  root.append(headingNode);
                  return;
                }
                // Heading 1: #
                if (line.trim().startsWith("# ")) {
                  const headingText = line.replace(/^#\s*/, "");
                  const headingNode = $createHeadingNode('h1');
                  headingNode.append($createTextNode(headingText));
                  root.append(headingNode);
                  return;
                }
                if (line.trim().startsWith("## ")) {
                  const headingText = line.replace(/^##\s*/, "");
                  const headingNode = $createHeadingNode('h2');
                  headingNode.append($createTextNode(headingText));
                  root.append(headingNode);
                  return;
                }
                // Heading 3: ###
                if (line.trim().startsWith("### ")) {
                  const headingText = line.replace(/^###\s*/, "");
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

            // Dispatch custom event to signal completion
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
