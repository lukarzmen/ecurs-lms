"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface AiGenerationProgressProps {
  label: string;
  stepLabel?: string;
  className?: string;
}

// Indeterminate progress bar with an elapsed-time counter, used to reassure
// users during long-running AI generation calls that nothing has frozen.
export function AiGenerationProgress({ label, stepLabel, className }: AiGenerationProgressProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={className ?? "space-y-2"}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{stepLabel ?? label}</span>
        <span className="ml-auto tabular-nums">{elapsedSeconds}s</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 animate-[ai-progress_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
      <style jsx>{`
        @keyframes ai-progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
      `}</style>
    </div>
  );
}
