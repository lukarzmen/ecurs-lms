// Shared course-description generator: single-shot mode (fast) and a "deeper analysis"
// quality mode (analyze selling points -> draft -> review -> fix), mirroring the
// multi-step pipeline used by the lesson builder for higher-accuracy AI content.

import { callLLM, callLLMJson } from './call-llm';

export { LLMTimeoutError } from './call-llm';

type TranslateFn = (
  key: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) => string;

export type CourseDescriptionOptions = {
  title: string;
  categoryName?: string;
  quality: boolean;
  maxSentences: number;
  singleShotSystemPrompt: string;
  singleShotUserPrompt: string;
  t: TranslateFn;
  // Reports the current pipeline step (1-based) so the UI can show progress.
  onProgress?: (step: number, totalSteps: number) => void;
};

function stripQuotes(text: string): string {
  return text.trim().replace(/^["']+|["']+$/g, '').trim();
}

async function runQualityPipeline(options: CourseDescriptionOptions): Promise<string> {
  const { title, categoryName, maxSentences, t, onProgress } = options;
  const totalSteps = 4;
  const category = categoryName?.trim() || t('descForm.aiNoCategory');

  onProgress?.(1, totalSteps);
  const analysisUser = t('descForm.aiAnalysisUser', { title, category });
  const analysisRaw = (await callLLMJson(t('descForm.aiAnalysisSystem'), analysisUser)) as {
    sellingPoints?: unknown;
    audience?: unknown;
    grounded?: unknown;
  };

  const sellingPoints = Array.isArray(analysisRaw.sellingPoints)
    ? analysisRaw.sellingPoints.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    : [];
  const audience = typeof analysisRaw.audience === 'string' ? analysisRaw.audience.trim() : '';
  const grounded = Boolean(analysisRaw.grounded);

  const draftUser = t('descForm.aiDraftUser', {
    title,
    category,
    audience: audience || t('descForm.aiNoAudience'),
    sellingPoints: sellingPoints.length > 0 ? sellingPoints.join('; ') : t('descForm.aiNoSellingPoints'),
    grounded: grounded ? 'true' : 'false',
    maxSentences,
  });
  const draftSystem = t('descForm.aiDraftSystem', { maxSentences });

  onProgress?.(2, totalSteps);
  const draft = stripQuotes(await callLLM(draftSystem, draftUser));
  if (!draft) {
    throw new Error('invalidObject');
  }

  onProgress?.(3, totalSteps);
  const reviewUser = t('descForm.aiReviewUser', { description: draft });
  const reviewRaw = (await callLLMJson(t('descForm.aiReviewSystem'), reviewUser)) as {
    issues?: unknown;
  };
  const issues = Array.isArray(reviewRaw.issues) ? reviewRaw.issues : [];

  if (issues.length === 0) {
    return draft;
  }

  try {
    onProgress?.(4, totalSteps);
    const fixUser = t('descForm.aiFixUser', {
      description: draft,
      issues: JSON.stringify(issues),
    });
    const fixed = stripQuotes(await callLLM(t('descForm.aiFixSystem'), fixUser));
    return fixed || draft;
  } catch {
    // Keep the draft if the fix pass itself fails – it already passed generation.
    return draft;
  }
}

export async function generateCourseDescription(options: CourseDescriptionOptions): Promise<string> {
  if (!options.quality) {
    options.onProgress?.(1, 1);
    return stripQuotes(await callLLM(options.singleShotSystemPrompt, options.singleShotUserPrompt));
  }

  return runQualityPipeline(options);
}
