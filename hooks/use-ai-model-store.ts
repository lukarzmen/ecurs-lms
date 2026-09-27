import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AI_MODELS, DEFAULT_AI_MODEL_ID } from "@/lib/ai/models";

type AiModelStore = {
  modelId: string;
  setModelId: (modelId: string) => void;
};

// Persists the teacher's last-chosen AI model across sessions (localStorage).
export const useAiModelStore = create<AiModelStore>()(
  persist(
    (set) => ({
      modelId: DEFAULT_AI_MODEL_ID,
      setModelId: (modelId) => set({ modelId }),
    }),
    {
      name: "ecurs-ai-model",
      // Heals stale localStorage values pointing at a model removed from the whitelist.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AiModelStore> | undefined;
        const modelId =
          persisted?.modelId && AI_MODELS.some((m) => m.id === persisted.modelId)
            ? persisted.modelId
            : DEFAULT_AI_MODEL_ID;
        return { ...currentState, ...persisted, modelId };
      },
    },
  ),
);
