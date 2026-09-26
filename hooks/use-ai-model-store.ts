import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_AI_MODEL_ID } from "@/lib/ai/models";

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
    { name: "ecurs-ai-model" },
  ),
);
