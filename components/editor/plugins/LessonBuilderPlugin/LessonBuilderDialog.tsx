import { LexicalEditor, $createParagraphNode, $createTextNode, $getRoot, $isParagraphNode } from 'lexical';
import { SelectAnswerNode } from '../../nodes/SelectAnserNode';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { $createListItemNode, $createListNode, ListType } from '@lexical/list';
import { $createEquationNode } from '../../nodes/EquationNode';
import { useCourseContext } from '../../context/CourseContext';
import { INSERT_TEST_COMMAND } from '../QuizPlugin';
import { INSERT_QA_COMMAND } from '../QuestionAnswerPlugin';
import { INSERT_TASK_COMMAND } from '../TaskPlugin';
import { INSERT_TODO_COMMAND } from '../TodoPlugin';
import { INSERT_TRUE_FALSE_COMMAND } from '../TrueFalsePlugin';
import { INSERT_ORDERING_COMMAND } from '../OrderingPlugin';
import { $createDictionaryNode, Dictionary } from '../../nodes/DictionaryNode';
import { useI18n } from '@/hooks/use-i18n';
import { Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AiGenerationProgress } from '@/components/ui/ai-generation-progress';

type BuilderPayload = {
  lessonTitle: string;
  lead: string;
  sections: Array<{ heading: string; content: string }>;
  summary: string;
  quiz: Array<{
    question: string;
    answers: string[];
    correctAnswerIndex: number;
    correctAnswerDescription: string | null;
  }>;
  openQuestions: Array<{
    question: string;
    answer: string;
    explanation: string | null;
  }>;
  descriptiveTasks: Array<{
    task: string;
    hint: string | null;
  }>;
  selectAnswer: {
    question: string;
    options: string[];
    correctIndex: number;
  } | null;
  todo: {
    title: string;
    items: Array<{ text: string }>;
  } | null;
  trueFalse: Array<{
    question: string;
    correctAnswer: boolean;
    explanation: string | null;
  }>;
  ordering: {
    title: string;
    items: Array<{ text: string }>;
  } | null;
  dictionary: Dictionary | null;
};

function getJsonCandidate(text: string): string {
  const trimmed = text.trim();
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');
  const candidate =
    start !== -1 && end !== -1 && end > start
      ? withoutFences.slice(start, end + 1)
      : withoutFences;

  return candidate;
}

function extractJsonObject(text: string): unknown {
  return JSON.parse(getJsonCandidate(text));
}

async function fetchTasksJson(payload: LLMPrompt): Promise<unknown> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('apiError');
  }

  const rawText = await res.text();
  try {
    return extractJsonObject(rawText);
  } catch (parseError) {
    const repairPayload: LLMPrompt = {
      systemPrompt:
        'Naprawiasz uszkodzony JSON. Zwracasz WYŁĄCZNIE poprawny JSON zgodny ze schematem wejściowym. Bez komentarzy, bez markdown, bez dodatkowego tekstu.',
      userPrompt: `Napraw poniższy JSON tak, aby był poprawny składniowo i zachował możliwie pełną treść.\n\nZwróć WYŁĄCZNIE JSON.\n\nDane wejściowe:\n${getJsonCandidate(rawText)}`,
    };

    const repairRes = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(repairPayload),
    });

    if (!repairRes.ok) {
      throw parseError;
    }

    const repairedRawText = await repairRes.text();
    return extractJsonObject(repairedRawText);
  }
}

type OutlineSection = {
  heading: string;
  keyPoints: string[];
  sourceGrounded: boolean;
};

function appendFormattedLine(root: ReturnType<typeof $getRoot>, line: string) {
  const paragraphNode = $createParagraphNode();
  const parts = line.split(/(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*)/g);

  parts.forEach((part) => {
    if (part.startsWith('$') && part.endsWith('$') && !part.startsWith('$$')) {
      const equation = part.slice(1, -1);
      paragraphNode.append($createEquationNode(equation, true));
      return;
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      const codeText = part.slice(1, -1);
      const textNode = $createTextNode(codeText);
      textNode.setFormat('code');
      paragraphNode.append(textNode);
      return;
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      const textNode = $createTextNode(boldText);
      textNode.setFormat('bold');
      paragraphNode.append(textNode);
      return;
    }

    paragraphNode.append($createTextNode(part));
  });

  root.append(paragraphNode);
}

function insertMarkdown(root: ReturnType<typeof $getRoot>, markdown: string) {
  const cleanedResponse = markdown.replace(/^#####\s*/gm, '');
  const lines = cleanedResponse
    .split('\n')
    .filter((line) => line.trim() !== '---' && line.trim() !== '');

  let inCodeBlock = false;
  let codeBlockContent = '';
  let inEquationBlock = false;
  let equationBlockContent = '';
  let activeList: { type: ListType; node: ReturnType<typeof $createListNode> } | null =
    null;

  lines.forEach((line) => {
    if (line.trim().startsWith('$$')) {
      if (inEquationBlock) {
        inEquationBlock = false;
        root.append($createEquationNode(equationBlockContent.trim(), false));
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
      const itemText = (bulletMatch[1] ?? '').trimEnd();
      if (!activeList || activeList.type !== 'bullet') {
        const listNode = $createListNode('bullet');
        root.append(listNode);
        activeList = { type: 'bullet', node: listNode };
      }

      const listItemNode = $createListItemNode();
      const paragraphNode = $createParagraphNode();
      const parts = itemText.split(/(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*)/g);
      parts.forEach((part) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const textNode = $createTextNode(part.slice(2, -2));
          textNode.setFormat('bold');
          paragraphNode.append(textNode);
        } else {
          paragraphNode.append($createTextNode(part));
        }
      });

      listItemNode.append(paragraphNode);
      activeList.node.append(listItemNode);
      return;
    }

    activeList = null;

    if (line.startsWith('# ')) {
      const node = $createHeadingNode('h1');
      node.append($createTextNode(line.replace(/^#\s*/, '')));
      root.append(node);
      return;
    }

    if (line.startsWith('## ')) {
      const node = $createHeadingNode('h2');
      node.append($createTextNode(line.replace(/^##\s*/, '')));
      root.append(node);
      return;
    }

    if (line.startsWith('### ')) {
      const node = $createHeadingNode('h3');
      node.append($createTextNode(line.replace(/^###\s*/, '')));
      root.append(node);
      return;
    }

    appendFormattedLine(root, line);
  });
}

function normalizePayload(raw: unknown): BuilderPayload {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('invalidObject');
  }

  const obj = raw as Record<string, unknown>;

  const lessonTitle = typeof obj.lessonTitle === 'string' ? obj.lessonTitle.trim() : '';
  const lead = typeof obj.lead === 'string' ? obj.lead.trim() : '';
  const summary = typeof obj.summary === 'string' ? obj.summary.trim() : '';

  const sections = Array.isArray(obj.sections)
    ? obj.sections
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null;
          const item = entry as Record<string, unknown>;
          const heading = typeof item.heading === 'string' ? item.heading.trim() : '';
          const content = typeof item.content === 'string' ? item.content.trim() : '';
          if (!heading || !content) return null;
          return { heading, content };
        })
        .filter((entry): entry is { heading: string; content: string } => entry !== null)
    : [];

  const quiz = Array.isArray(obj.quiz)
    ? obj.quiz
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null;
          const item = entry as Record<string, unknown>;
          const question = typeof item.question === 'string' ? item.question.trim() : '';
          const answers = Array.isArray(item.answers)
            ? item.answers
                .map((answer) => (typeof answer === 'string' ? answer.trim() : ''))
                .filter(Boolean)
            : [];
          const correctAnswerIndex = Number(item.correctAnswerIndex);
          const correctAnswerDescription =
            typeof item.correctAnswerDescription === 'string'
              ? item.correctAnswerDescription.trim()
              : null;

          if (!question || answers.length !== 4 || !Number.isInteger(correctAnswerIndex)) {
            return null;
          }

          if (correctAnswerIndex < 0 || correctAnswerIndex > 3) {
            return null;
          }

          return {
            question,
            answers,
            correctAnswerIndex,
            correctAnswerDescription,
          };
        })
        .filter(
          (
            entry,
          ): entry is {
            question: string;
            answers: string[];
            correctAnswerIndex: number;
            correctAnswerDescription: string | null;
          } => entry !== null,
        )
    : [];

  const openQuestions = Array.isArray(obj.openQuestions)
    ? obj.openQuestions
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null;
          const item = entry as Record<string, unknown>;
          const question = typeof item.question === 'string' ? item.question.trim() : '';
          const answer = typeof item.answer === 'string' ? item.answer.trim() : '';
          const explanation =
            typeof item.explanation === 'string' ? item.explanation.trim() : null;
          if (!question || !answer) return null;
          return { question, answer, explanation };
        })
        .filter(
          (
            entry,
          ): entry is { question: string; answer: string; explanation: string | null } =>
            entry !== null,
        )
    : [];

  const descriptiveTasks = Array.isArray(obj.descriptiveTasks)
    ? obj.descriptiveTasks
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null;
          const item = entry as Record<string, unknown>;
          const task = typeof item.task === 'string' ? item.task.trim() : '';
          const hint = typeof item.hint === 'string' ? item.hint.trim() : null;
          if (!task) return null;
          return { task, hint };
        })
        .filter((entry): entry is { task: string; hint: string | null } => entry !== null)
    : [];

  const selectAnswer =
    obj.selectAnswer && typeof obj.selectAnswer === 'object' && !Array.isArray(obj.selectAnswer)
      ? (() => {
          const item = obj.selectAnswer as Record<string, unknown>;
          const question = typeof item.question === 'string' ? item.question.trim() : '';
          const options = Array.isArray(item.options)
            ? item.options
                .map((option) => (typeof option === 'string' ? option.trim() : ''))
                .filter(Boolean)
            : [];
          const correctIndex = Number(item.correctIndex);

          if (options.length < 2 || options.length > 8 || !Number.isInteger(correctIndex)) {
            return null;
          }

          if (correctIndex < 0 || correctIndex >= options.length) {
            return null;
          }

          return { question, options, correctIndex };
        })()
      : null;

  const todo = obj.todo && typeof obj.todo === 'object' && !Array.isArray(obj.todo)
    ? (() => {
        const item = obj.todo as Record<string, unknown>;
        const title = typeof item.title === 'string' ? item.title.trim() : '';
        const items = Array.isArray(item.items)
          ? item.items
              .map((entry) => {
                if (!entry || typeof entry !== 'object') return null;
                const row = entry as Record<string, unknown>;
                const text = typeof row.text === 'string' ? row.text.trim() : '';
                if (!text) return null;
                return { text };
              })
              .filter((entry): entry is { text: string } => entry !== null)
          : [];

        if (!title || items.length === 0) {
          return null;
        }

        return { title, items };
      })()
    : null;

  const trueFalse = Array.isArray(obj.trueFalse)
    ? obj.trueFalse
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null;
          const item = entry as Record<string, unknown>;
          const question = typeof item.question === 'string' ? item.question.trim() : '';
          const correctAnswer = Boolean(item.correctAnswer);
          const explanation = typeof item.explanation === 'string' ? item.explanation.trim() : null;
          if (!question) return null;
          return { question, correctAnswer, explanation };
        })
        .filter((e): e is { question: string; correctAnswer: boolean; explanation: string | null } => e !== null)
    : [];

  const ordering =
    obj.ordering && typeof obj.ordering === 'object' && !Array.isArray(obj.ordering)
      ? (() => {
          const item = obj.ordering as Record<string, unknown>;
          const title = typeof item.title === 'string' ? item.title.trim() : '';
          const items = Array.isArray(item.items)
            ? item.items
                .map((entry, idx) => {
                  if (!entry || typeof entry !== 'object') return null;
                  const row = entry as Record<string, unknown>;
                  const text = typeof row.text === 'string' ? row.text.trim() : '';
                  if (!text) return null;
                  return { id: `ord-${idx}`, text };
                })
                .filter((e): e is { id: string; text: string } => e !== null)
            : [];
          if (items.length < 2) return null;
          return { title, items };
        })()
      : null;

  const dictionary =
    obj.dictionary && typeof obj.dictionary === 'object' && !Array.isArray(obj.dictionary)
      ? (() => {
          const raw = obj.dictionary as Record<string, unknown>;
          const result: Dictionary = {};
          for (const [k, v] of Object.entries(raw)) {
            if (typeof v === 'string') result[k.trim()] = v.trim();
          }
          return Object.keys(result).length > 0 ? result : null;
        })()
      : null;

  return {
    lessonTitle,
    lead,
    sections,
    summary,
    quiz,
    openQuestions,
    descriptiveTasks,
    selectAnswer,
    todo,
    trueFalse,
    ordering,
    dictionary,
  };
}

export function LessonBuilderDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const { t } = useI18n();
  const { module } = useCourseContext();

  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [sourceMaterial, setSourceMaterial] = useState('');
  const [qualityMode, setQualityMode] = useState(true);
  const [difficulty, setDifficulty] = useState('średniozaawansowany');
  const [sectionCount, setSectionCount] = useState(4);
  const [quizCount, setQuizCount] = useState(5);
  const [openQuestionCount, setOpenQuestionCount] = useState(3);
  const [taskCount, setTaskCount] = useState(3);
  const [todoCount, setTodoCount] = useState(5);
  const [trueFalseCount, setTrueFalseCount] = useState(5);
  const [orderingItemCount, setOrderingItemCount] = useState(6);
  const [dictionaryEntryCount, setDictionaryEntryCount] = useState(10);
  const [includeQuiz, setIncludeQuiz] = useState(true);
  const [includeDictionary, setIncludeDictionary] = useState(true);
  const [includeOpenQuestions, setIncludeOpenQuestions] = useState(false);
  const [includeTasks, setIncludeTasks] = useState(false);
  const [includeSelectAnswer, setIncludeSelectAnswer] = useState(false);
  const [includeTodo, setIncludeTodo] = useState(false);
  const [includeTrueFalse, setIncludeTrueFalse] = useState(false);
  const [includeOrdering, setIncludeOrdering] = useState(false);
  const [loading, setLoading] = useState(false);

  const courseContext = useMemo(() => {
    const lines: string[] = [];
    if (module?.courseName) {
      lines.push(t('ed.lessonBuilderContextCourse').replace('{name}', module.courseName));
    }
    if (module?.moduleName) {
      lines.push(t('ed.lessonBuilderContextModule').replace('{name}', module.moduleName));
    }
    return lines.join('\n');
  }, [module?.courseName, module?.moduleName, t]);

  const topicPlaceholder = useMemo(() => {
    const courseName = module?.courseName?.trim();
    const moduleName = module?.moduleName?.trim();

    if (courseName && moduleName) {
      return `${moduleName} (${courseName})`;
    }

    if (moduleName) {
      return moduleName;
    }

    if (courseName) {
      return `${t('ed.lessonBuilderTopicCoursePrefix')}: ${courseName}`;
    }

    return t('ed.lessonBuilderTopicPlaceholder');
  }, [module?.courseName, module?.moduleName, t]);

  useEffect(() => {
    setTopic((currentTopic) => {
      if (currentTopic.trim().length > 0) {
        return currentTopic;
      }
      return topicPlaceholder;
    });
  }, [topicPlaceholder]);

  // Single-shot: one request generates the whole lesson package. Fast, but prone to generic filler.
  const runSingleShot = async (): Promise<BuilderPayload> => {
    const userPrompt = t('ed.lessonBuilderPromptUser')
      .replace('{topic}', topic.trim())
      .replace('{details}', details.trim() || t('ed.lessonBuilderNoDetails'))
      .replace('{difficulty}', difficulty)
      .replace('{sections}', String(Math.max(2, Math.min(sectionCount, 10))))
      .replace('{quizCount}', String(includeQuiz ? Math.max(1, Math.min(quizCount, 20)) : 0))
      .replace('{openQuestionCount}', String(includeOpenQuestions ? Math.max(1, Math.min(openQuestionCount, 20)) : 0))
      .replace('{taskCount}', String(includeTasks ? Math.max(1, Math.min(taskCount, 20)) : 0))
      .replace('{todoCount}', String(includeTodo ? Math.max(1, Math.min(todoCount, 20)) : 0))
      .replace('{trueFalseCount}', String(includeTrueFalse ? Math.max(3, Math.min(trueFalseCount, 20)) : 0))
      .replace('{orderingItemCount}', String(includeOrdering ? Math.max(3, Math.min(orderingItemCount, 20)) : 0))
      .replace('{dictionaryEntryCount}', String(includeDictionary ? Math.max(3, Math.min(dictionaryEntryCount, 30)) : 0))
      .replace('{includeQuiz}', includeQuiz ? 'true' : 'false')
      .replace('{includeOpenQuestions}', includeOpenQuestions ? 'true' : 'false')
      .replace('{includeTasks}', includeTasks ? 'true' : 'false')
      .replace('{includeSelectAnswer}', includeSelectAnswer ? 'true' : 'false')
      .replace('{includeTodo}', includeTodo ? 'true' : 'false')
      .replace('{includeTrueFalse}', includeTrueFalse ? 'true' : 'false')
      .replace('{includeOrdering}', includeOrdering ? 'true' : 'false')
      .replace('{includeDictionary}', includeDictionary ? 'true' : 'false')
      .replace('{context}', courseContext || t('ed.lessonBuilderNoContext'));

    const raw = await fetchTasksJson({
      systemPrompt: t('ed.lessonBuilderPromptSystem'),
      userPrompt,
    });

    return normalizePayload(raw);
  };

  // Quality mode: outline -> per-section content -> anti-slop review/fix -> meta (lead/summary/quiz).
  // Slower and costs more tokens, but grounds content in author-supplied source material instead of guessing.
  const runQualityPipeline = async (): Promise<BuilderPayload> => {
    const sourceMaterialText = sourceMaterial.trim() || t('ed.lessonBuilderNoSourceMaterial');

    const outlineUserPrompt = t('ed.lessonBuilderOutlineUser')
      .replace('{topic}', topic.trim())
      .replace('{difficulty}', difficulty)
      .replace('{sections}', String(Math.max(2, Math.min(sectionCount, 10))))
      .replace('{sourceMaterial}', sourceMaterialText)
      .replace('{details}', details.trim() || t('ed.lessonBuilderNoDetails'))
      .replace('{context}', courseContext || t('ed.lessonBuilderNoContext'));

    const outlineRaw = (await fetchTasksJson({
      systemPrompt: t('ed.lessonBuilderOutlineSystem'),
      userPrompt: outlineUserPrompt,
    })) as { lessonTitle?: unknown; outline?: unknown };

    const lessonTitle =
      typeof outlineRaw.lessonTitle === 'string' && outlineRaw.lessonTitle.trim()
        ? outlineRaw.lessonTitle.trim()
        : topic.trim();

    const outline: OutlineSection[] = Array.isArray(outlineRaw.outline)
      ? outlineRaw.outline
          .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const item = entry as Record<string, unknown>;
            const heading = typeof item.heading === 'string' ? item.heading.trim() : '';
            const keyPoints = Array.isArray(item.keyPoints)
              ? item.keyPoints.map((p) => (typeof p === 'string' ? p.trim() : '')).filter(Boolean)
              : [];
            if (!heading) return null;
            return { heading, keyPoints, sourceGrounded: Boolean(item.sourceGrounded) };
          })
          .filter((entry): entry is OutlineSection => entry !== null)
      : [];

    if (outline.length === 0) {
      throw new Error('invalidObject');
    }

    const draftSections = await Promise.all(
      outline.map(async (section) => {
        const sectionUserPrompt = t('ed.lessonBuilderSectionUser')
          .replace('{heading}', section.heading)
          .replace('{keyPoints}', section.keyPoints.join('; '))
          .replace('{sourceGrounded}', section.sourceGrounded ? 'true' : 'false')
          .replace('{difficulty}', difficulty)
          .replace('{sourceMaterial}', sourceMaterialText);

        const raw = (await fetchTasksJson({
          systemPrompt: t('ed.lessonBuilderSectionSystem'),
          userPrompt: sectionUserPrompt,
        })) as { content?: unknown };

        return {
          heading: section.heading,
          content: typeof raw.content === 'string' ? raw.content.trim() : '',
        };
      }),
    );

    const reviewedSections = await Promise.all(
      draftSections.map(async (section) => {
        if (!section.content) return section;

        const reviewUserPrompt = t('ed.lessonBuilderReviewUser')
          .replace('{sourceMaterial}', sourceMaterialText)
          .replace('{heading}', section.heading)
          .replace('{content}', section.content);

        const reviewRaw = (await fetchTasksJson({
          systemPrompt: t('ed.lessonBuilderReviewSystem'),
          userPrompt: reviewUserPrompt,
        })) as { issues?: unknown };

        const issues = Array.isArray(reviewRaw.issues) ? reviewRaw.issues : [];
        if (issues.length === 0) return section;

        const fixUserPrompt = t('ed.lessonBuilderFixUser')
          .replace('{heading}', section.heading)
          .replace('{content}', section.content)
          .replace('{issues}', JSON.stringify(issues));

        try {
          const fixRaw = (await fetchTasksJson({
            systemPrompt: t('ed.lessonBuilderFixSystem'),
            userPrompt: fixUserPrompt,
          })) as { content?: unknown };

          const fixedContent = typeof fixRaw.content === 'string' ? fixRaw.content.trim() : '';
          return { heading: section.heading, content: fixedContent || section.content };
        } catch {
          // Keep the original draft if the fix pass itself fails – it already passed generation.
          return section;
        }
      }),
    );

    const fullContent = reviewedSections.map((s) => `## ${s.heading}\n${s.content}`).join('\n\n');

    const metaUserPrompt = t('ed.lessonBuilderMetaUser')
      .replace('{topic}', topic.trim())
      .replace('{difficulty}', difficulty)
      .replace('{fullContent}', fullContent)
      .replace('{includeQuiz}', includeQuiz ? 'true' : 'false')
      .replace('{includeOpenQuestions}', includeOpenQuestions ? 'true' : 'false')
      .replace('{includeTasks}', includeTasks ? 'true' : 'false')
      .replace('{includeSelectAnswer}', includeSelectAnswer ? 'true' : 'false')
      .replace('{includeTodo}', includeTodo ? 'true' : 'false')
      .replace('{includeTrueFalse}', includeTrueFalse ? 'true' : 'false')
      .replace('{includeOrdering}', includeOrdering ? 'true' : 'false')
      .replace('{includeDictionary}', includeDictionary ? 'true' : 'false')
      .replace('{quizCount}', String(includeQuiz ? Math.max(1, Math.min(quizCount, 20)) : 0))
      .replace('{openQuestionCount}', String(includeOpenQuestions ? Math.max(1, Math.min(openQuestionCount, 20)) : 0))
      .replace('{taskCount}', String(includeTasks ? Math.max(1, Math.min(taskCount, 20)) : 0))
      .replace('{todoCount}', String(includeTodo ? Math.max(1, Math.min(todoCount, 20)) : 0))
      .replace('{trueFalseCount}', String(includeTrueFalse ? Math.max(3, Math.min(trueFalseCount, 20)) : 0))
      .replace('{orderingItemCount}', String(includeOrdering ? Math.max(3, Math.min(orderingItemCount, 20)) : 0))
      .replace('{dictionaryEntryCount}', String(includeDictionary ? Math.max(3, Math.min(dictionaryEntryCount, 30)) : 0));

    const metaRaw = await fetchTasksJson({
      systemPrompt: t('ed.lessonBuilderMetaSystem'),
      userPrompt: metaUserPrompt,
    });

    const metaObj = metaRaw && typeof metaRaw === 'object' ? (metaRaw as Record<string, unknown>) : {};

    return normalizePayload({
      lessonTitle,
      sections: reviewedSections,
      ...metaObj,
    });
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error(t('ed.lessonBuilderTopicRequired'));
      return;
    }

    setLoading(true);

    try {
      const normalized = qualityMode ? await runQualityPipeline() : await runSingleShot();

      // Helper – appends an empty paragraph separator to root (idempotent: skips if last child is already empty paragraph)
      const sep = () => {
        activeEditor.update(() => {
          const root = $getRoot();
          const last = root.getLastChild();
          if (!last || !($isParagraphNode(last) && last.getTextContent() === '')) {
            root.append($createParagraphNode());
          }
        });
      };

      // Interactive blocks insert at the current selection – keep it pinned to the
      // document end before every dispatch so mixed insertion stays in order.
      const selectEnd = () => {
        activeEditor.update(() => {
          $getRoot().selectEnd();
        });
      };

      // Splits an array into up to `maxChunks` near-equal pieces so a single generated
      // batch (e.g. 6 quiz questions) can be spread across several sections instead of
      // landing as one big block.
      const chunkArray = <T,>(items: T[], maxChunks: number): T[][] => {
        if (items.length === 0 || maxChunks <= 0) return [];
        const chunkCount = Math.min(items.length, maxChunks);
        const chunks: T[][] = [];
        const base = Math.floor(items.length / chunkCount);
        let remainder = items.length % chunkCount;
        let idx = 0;
        for (let c = 0; c < chunkCount; c++) {
          const size = base + (remainder > 0 ? 1 : 0);
          if (remainder > 0) remainder--;
          chunks.push(items.slice(idx, idx + size));
          idx += size;
        }
        return chunks;
      };

      type InsertJob = () => void;
      const jobs: InsertJob[] = [];
      const sectionSplitCount = Math.max(normalized.sections.length, 1);

      if (includeQuiz && normalized.quiz.length > 0) {
        chunkArray(normalized.quiz, sectionSplitCount).forEach((tests) => {
          jobs.push(() => activeEditor.dispatchCommand(INSERT_TEST_COMMAND, { tests }));
        });
      }

      if (includeOpenQuestions && normalized.openQuestions.length > 0) {
        chunkArray(normalized.openQuestions, sectionSplitCount).forEach((items) => {
          jobs.push(() => activeEditor.dispatchCommand(INSERT_QA_COMMAND, { items }));
        });
      }

      if (includeTasks && normalized.descriptiveTasks.length > 0) {
        chunkArray(normalized.descriptiveTasks, sectionSplitCount).forEach((items) => {
          jobs.push(() => activeEditor.dispatchCommand(INSERT_TASK_COMMAND, { items }));
        });
      }

      if (includeTrueFalse && normalized.trueFalse.length > 0) {
        chunkArray(normalized.trueFalse, sectionSplitCount).forEach((questions) => {
          jobs.push(() => activeEditor.dispatchCommand(INSERT_TRUE_FALSE_COMMAND, { questions }));
        });
      }

      // SelectAnswer is inline-only in its plugin – insert as explicit block here,
      // preceded by a heading with the question text so it has context.
      if (includeSelectAnswer && normalized.selectAnswer) {
        const sa = normalized.selectAnswer;
        jobs.push(() => {
          activeEditor.update(() => {
            const root = $getRoot();

            if (sa.question) {
              const questionHeading = $createHeadingNode('h3');
              questionHeading.append($createTextNode(sa.question));
              root.append(questionHeading);
            }

            const wrapper = $createParagraphNode();
            const saNode = new SelectAnswerNode({
              options: sa.options,
              selectedIndex: sa.correctIndex,
            });
            wrapper.append(saNode);
            root.append(wrapper);
          });
        });
      }

      if (includeTodo && normalized.todo) {
        const todoPayload = normalized.todo;
        jobs.push(() =>
          activeEditor.dispatchCommand(INSERT_TODO_COMMAND, {
            title: todoPayload.title,
            items: todoPayload.items.map((entry) => ({
              id: Math.random().toString(36).slice(2),
              text: entry.text,
              checked: false,
            })),
          }),
        );
      }

      if (includeOrdering && normalized.ordering) {
        const orderingPayload = normalized.ordering;
        jobs.push(() =>
          activeEditor.dispatchCommand(INSERT_ORDERING_COMMAND, {
            items: orderingPayload.items.map((item, idx) => ({
              id: `ord-${idx}-${item.text.slice(0, 8)}`,
              text: item.text,
            })),
          }),
        );
      }

      if (includeDictionary && normalized.dictionary) {
        const dictionaryPayload = normalized.dictionary;
        jobs.push(() => {
          activeEditor.update(() => {
            const root = $getRoot();
            const node = $createDictionaryNode(dictionaryPayload, true);
            const wrapper = $createParagraphNode();
            wrapper.append(node);
            root.append($createParagraphNode());
            root.append(wrapper);
          });
        });
      }

      // Round-robin the jobs over the section indices so interactive blocks land
      // right after the section they relate to, mixed with the text, instead of
      // all being dumped after the last section.
      const jobsBySlot = new Map<number, InsertJob[]>();
      jobs.forEach((job, i) => {
        const slot = normalized.sections.length > 0 ? i % normalized.sections.length : -1;
        const bucket = jobsBySlot.get(slot) ?? [];
        bucket.push(job);
        jobsBySlot.set(slot, bucket);
      });

      const runJobs = (slot: number) => {
        const slotJobs = jobsBySlot.get(slot);
        if (!slotJobs || slotJobs.length === 0) return;
        slotJobs.forEach((job) => {
          selectEnd();
          sep();
          job();
          sep();
        });
      };

      activeEditor.update(() => {
        const root = $getRoot();

        if (normalized.lessonTitle) {
          const headingNode = $createHeadingNode('h1');
          headingNode.append($createTextNode(normalized.lessonTitle));
          root.append(headingNode);
        }

        if (normalized.lead) {
          insertMarkdown(root, normalized.lead);
        }
      });

      normalized.sections.forEach((section, index) => {
        activeEditor.update(() => {
          const root = $getRoot();
          const headingNode = $createHeadingNode('h2');
          headingNode.append($createTextNode(section.heading));
          root.append(headingNode);
          insertMarkdown(root, section.content);
        });

        runJobs(index);
      });

      // No sections were generated – fall back to appending interactive blocks right away.
      runJobs(-1);

      if (normalized.summary) {
        activeEditor.update(() => {
          const root = $getRoot();
          const headingNode = $createHeadingNode('h3');
          headingNode.append($createTextNode(t('ed.lessonBuilderSummaryHeading')));
          root.append(headingNode);
          insertMarkdown(root, normalized.summary);
        });
      }

      activeEditor.update(() => {
        const root = $getRoot();
        root.append($createParagraphNode());
        root.selectEnd();
      });

      toast.success(t('ed.lessonBuilderSuccess'));
      onClose();
    } catch (error) {
      console.error('LessonBuilder generation error:', error);
      toast.error(t('ed.lessonBuilderError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-foreground">{t('ed.lessonBuilderTitle')}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground"
            type="button"
            aria-label={t('ed.close')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">{t('ed.lessonBuilderDescription')}</p>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">{t('ed.lessonBuilderTopic')}</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={topicPlaceholder}
              className="w-full rounded-md border-2 border-border bg-background px-3 py-2 text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">{t('ed.lessonBuilderDetails')}</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t('ed.lessonBuilderDetailsPlaceholder')}
              rows={3}
              className="w-full rounded-md border-2 border-border bg-background px-3 py-2 text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">{t('ed.lessonBuilderSourceMaterial')}</label>
            <textarea
              value={sourceMaterial}
              onChange={(e) => setSourceMaterial(e.target.value)}
              placeholder={t('ed.lessonBuilderSourceMaterialPlaceholder')}
              rows={4}
              className="w-full rounded-md border-2 border-border bg-background px-3 py-2 text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('ed.lessonBuilderSourceMaterialHint')}</p>
          </div>

          <label className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
            <input
              type="checkbox"
              checked={qualityMode}
              onChange={(e) => setQualityMode(e.target.checked)}
              disabled={loading}
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium text-foreground">{t('ed.lessonBuilderQualityMode')}</span>
              <span className="block text-xs text-muted-foreground">{t('ed.lessonBuilderQualityModeHint')}</span>
            </span>
          </label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">{t('ed.lessonBuilderDifficulty')}</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-md border-2 border-border bg-background px-3 py-2 text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30"
                disabled={loading}>
                <option value="początkujący">{t('ed.lessonBuilderDifficultyBeginner')}</option>
                <option value="średniozaawansowany">{t('ed.lessonBuilderDifficultyIntermediate')}</option>
                <option value="zaawansowany">{t('ed.lessonBuilderDifficultyAdvanced')}</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">{t('ed.lessonBuilderSectionCount')}</label>
              <input
                type="number"
                min={2}
                max={10}
                value={sectionCount}
                onChange={(e) => setSectionCount(Math.max(2, Math.min(Number(e.target.value) || 2, 10)))}
                className="w-full rounded-md border-2 border-border bg-background px-3 py-2 text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30"
                disabled={loading}
              />
            </div>
          </div>

          <div className="rounded-md border border-border p-4">
            <p className="mb-3 text-sm font-medium text-foreground">{t('ed.lessonBuilderComponents')}</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeQuiz} onChange={(e) => setIncludeQuiz(e.target.checked)} disabled={loading} />
                {t('ed.lessonBuilderIncludeQuiz')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeDictionary} onChange={(e) => setIncludeDictionary(e.target.checked)} disabled={loading} />
                {t('ed.lessonBuilderIncludeDictionary')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeTrueFalse} onChange={(e) => setIncludeTrueFalse(e.target.checked)} disabled={loading} />
                {t('ed.lessonBuilderIncludeTrueFalse')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeOrdering} onChange={(e) => setIncludeOrdering(e.target.checked)} disabled={loading} />
                {t('ed.lessonBuilderIncludeOrdering')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeOpenQuestions} onChange={(e) => setIncludeOpenQuestions(e.target.checked)} disabled={loading} />
                {t('ed.lessonBuilderIncludeOpenQuestions')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeTasks} onChange={(e) => setIncludeTasks(e.target.checked)} disabled={loading} />
                {t('ed.lessonBuilderIncludeTasks')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeSelectAnswer} onChange={(e) => setIncludeSelectAnswer(e.target.checked)} disabled={loading} />
                {t('ed.lessonBuilderIncludeSelect')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeTodo} onChange={(e) => setIncludeTodo(e.target.checked)} disabled={loading} />
                {t('ed.lessonBuilderIncludeTodo')}
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('ed.lessonBuilderQuizCount')}</label>
                <input type="number" min={1} max={20} value={quizCount}
                  onChange={(e) => setQuizCount(Math.max(1, Math.min(Number(e.target.value) || 1, 20)))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  disabled={loading || !includeQuiz} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('ed.lessonBuilderDictionaryCount')}</label>
                <input type="number" min={3} max={30} value={dictionaryEntryCount}
                  onChange={(e) => setDictionaryEntryCount(Math.max(3, Math.min(Number(e.target.value) || 3, 30)))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  disabled={loading || !includeDictionary} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('ed.lessonBuilderTrueFalseCount')}</label>
                <input type="number" min={3} max={20} value={trueFalseCount}
                  onChange={(e) => setTrueFalseCount(Math.max(3, Math.min(Number(e.target.value) || 3, 20)))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  disabled={loading || !includeTrueFalse} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('ed.lessonBuilderOrderingCount')}</label>
                <input type="number" min={3} max={20} value={orderingItemCount}
                  onChange={(e) => setOrderingItemCount(Math.max(3, Math.min(Number(e.target.value) || 3, 20)))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  disabled={loading || !includeOrdering} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('ed.lessonBuilderOpenQuestionCount')}</label>
                <input type="number" min={1} max={20} value={openQuestionCount}
                  onChange={(e) => setOpenQuestionCount(Math.max(1, Math.min(Number(e.target.value) || 1, 20)))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  disabled={loading || !includeOpenQuestions} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('ed.lessonBuilderTaskCount')}</label>
                <input type="number" min={1} max={20} value={taskCount}
                  onChange={(e) => setTaskCount(Math.max(1, Math.min(Number(e.target.value) || 1, 20)))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  disabled={loading || !includeTasks} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('ed.lessonBuilderTodoCount')}</label>
                <input type="number" min={1} max={20} value={todoCount}
                  onChange={(e) => setTodoCount(Math.max(1, Math.min(Number(e.target.value) || 1, 20)))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  disabled={loading || !includeTodo} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {loading ? (
              <AiGenerationProgress label={t('ed.generating')} className="w-full space-y-2" />
            ) : (
              <>
                <button
                  onClick={onClose}
                  type="button"
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  disabled={loading}>
                  {t('ed.cancel')}
                </button>
                <button
                  onClick={handleGenerate}
                  type="button"
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading || !topic.trim()}>
                  <Sparkles className="h-4 w-4" />
                  {t('ed.lessonBuilderGenerate')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
