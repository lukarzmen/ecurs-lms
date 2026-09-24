// Shared lesson-title generator: single-shot mode (fast) and a "deeper analysis"
// quality mode (analyze subtopics -> draft -> review -> fix), mirroring the
// multi-step pipeline used by the course-description generator and lesson builder.

import { callLLM, callLLMJson } from './call-llm';

export { LLMTimeoutError } from './call-llm';

type TranslateFn = (
  key: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) => string;

export type LessonTitlesOptions = {
  courseTitle: string;
  courseDescription: string;
  existingChapters: string[];
  quality: boolean;
  singleShotSystemPrompt: string;
  singleShotUserPrompt: string;
  t: TranslateFn;
  // Reports the current pipeline step (1-based) so the UI can show progress.
  onProgress?: (step: number, totalSteps: number) => void;
};

function parseTitles(raw: string): string[] {
  return raw
    .split('\n')
    .map((title) => title.trim().replace(/^["'\-–•\d.)\s]+/, '').trim())
    .filter((title) => title.length > 0)
    .slice(0, 15);
}

async function runQualityPipeline(options: LessonTitlesOptions): Promise<string[]> {
  const { courseTitle, courseDescription, existingChapters, t, onProgress } = options;
  const totalSteps = 4;
  const existing =
    existingChapters.length > 0
      ? existingChapters.map((title, i) => `${i + 1}. ${title}`).join('\n')
      : t('chaptersForm.aiNoExistingChapters');

  onProgress?.(1, totalSteps);
  const analysisUser = t('chaptersForm.aiAnalysisUser', {
    title: courseTitle || t('chaptersForm.aiNoCategory'),
    description: courseDescription,
    existing,
  });
  const analysisRaw = (await callLLMJson(t('chaptersForm.aiAnalysisSystem'), analysisUser)) as {
    subtopics?: unknown;
    audience?: unknown;
  };

  const subtopics = Array.isArray(analysisRaw.subtopics)
    ? analysisRaw.subtopics.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    : [];
  const audience = typeof analysisRaw.audience === 'string' ? analysisRaw.audience.trim() : '';

  const draftUser = t('chaptersForm.aiDraftUser', {
    title: courseTitle,
    description: courseDescription,
    audience: audience || t('chaptersForm.aiNoAudience'),
    subtopics: subtopics.length > 0 ? subtopics.join('; ') : t('chaptersForm.aiNoSubtopics'),
    existing,
  });

  onProgress?.(2, totalSteps);
  const draft = parseTitles(await callLLM(t('chaptersForm.aiDraftSystem'), draftUser));
  if (draft.length === 0) {
    throw new Error('invalidObject');
  }

  onProgress?.(3, totalSteps);
  const reviewUser = t('chaptersForm.aiReviewUser', {
    titles: draft.map((title, i) => `${i + 1}. ${title}`).join('\n'),
    existing,
  });
  const reviewRaw = (await callLLMJson(t('chaptersForm.aiReviewSystem'), reviewUser)) as {
    issues?: unknown;
  };
  const issues = Array.isArray(reviewRaw.issues) ? reviewRaw.issues : [];

  if (issues.length === 0) {
    return draft;
  }

  try {
    onProgress?.(4, totalSteps);
    const fixUser = t('chaptersForm.aiFixUser', {
      titles: draft.join('\n'),
      issues: JSON.stringify(issues),
    });
    const fixed = parseTitles(await callLLM(t('chaptersForm.aiFixSystem'), fixUser));
    return fixed.length > 0 ? fixed : draft;
  } catch {
    // Keep the draft if the fix pass itself fails – it already passed generation.
    return draft;
  }
}

export async function generateLessonTitles(options: LessonTitlesOptions): Promise<string[]> {
  if (!options.quality) {
    options.onProgress?.(1, 1);
    return parseTitles(await callLLM(options.singleShotSystemPrompt, options.singleShotUserPrompt));
  }

  return runQualityPipeline(options);
}
