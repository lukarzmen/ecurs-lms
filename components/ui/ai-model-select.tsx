"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AiCostTier, groupModelsByProvider } from "@/lib/ai/models";
import { useAiModelStore } from "@/hooks/use-ai-model-store";
import { useI18n } from "@/hooks/use-i18n";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  deepseek: "DeepSeek",
};

const COST_BADGE: Record<AiCostTier, string> = {
  low: "$",
  medium: "$$",
  high: "$$$",
};

interface AiModelSelectProps {
  disabled?: boolean;
  className?: string;
}

// Lets the teacher pick which AI model handles the next generation call; the
// choice is persisted (see useAiModelStore) so it carries over between forms.
export function AiModelSelect({ disabled, className }: AiModelSelectProps) {
  const { modelId, setModelId } = useAiModelStore();
  const { t } = useI18n();
  const grouped = groupModelsByProvider();

  return (
    <Select value={modelId} onValueChange={setModelId} disabled={disabled}>
      <SelectTrigger className={className ?? "w-[220px]"}>
        <SelectValue placeholder={t("aiModel.select")} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(grouped)
          .filter(([, models]) => models.length > 0)
          .map(([provider, models]) => (
            <SelectGroup key={provider}>
              <SelectLabel>{PROVIDER_LABELS[provider] ?? provider}</SelectLabel>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.label} <span className="text-muted-foreground">({COST_BADGE[model.costTier]})</span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
      </SelectContent>
    </Select>
  );
}
