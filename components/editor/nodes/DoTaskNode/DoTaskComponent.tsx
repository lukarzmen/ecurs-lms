import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import ProgressSpinner from "../../plugins/TextGeneratorPlugin/ProgressComponent";
import { DoTaskType } from "../../plugins/TaskPlugin";

// Add props for initial state and callback
interface DoTaskComponentProps extends DoTaskType {
    initialCompleted: boolean;
    onComplete: (isCorrect: boolean) => void;
}

function DoTaskComponent({
    task,
    hint,
    initialCompleted,
    onComplete
}: DoTaskComponentProps) {
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(initialCompleted ? true : null);
  const [isLoading, setIsLoading] = useState(false);
  const [llmExplanation, setLlmExplanation] = useState<string | null>(null);

  useEffect(() => {
      setIsCorrect(initialCompleted ? true : null);
      setLlmExplanation(null);
  }, [initialCompleted]);

  const handleCheck = async () => {
    if (!userInput.trim()) {
      return;
    }
    setIsLoading(true);
    setIsCorrect(null);
    setLlmExplanation(null);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt: ``,
          systemPrompt: `Zweryfikuj poprawność odpowiedzi użytkownika na podstawie instrukcji. Bądź zwięzły.
Odpowiedz "true", jeśli odpowiedź jest poprawna.
Odpowiedz "false: [twoje wyjaśnienie]", jeśli odpowiedź jest niepoprawna, podając krótkie wyjaśnienie, dlaczego.
Na przykład: "false: Stolicą Francji jest Paryż, a nie Berlin."
###
instrukcja: ${task}
###
odpowiedź_użytkownika: ${userInput.trim()}
###`,
        }),
      });

      if (!response.ok) {
          throw new Error(`Błąd API: ${response.statusText}`);
      }

      const text = await response.text();
      const textLower = text.trim().toLowerCase();
      let isVerifiedCorrect = false;
      let explanationFromLlm = null;

      if (textLower.startsWith('true')) {
        isVerifiedCorrect = true;
      } else if (textLower.startsWith('false')) {
        isVerifiedCorrect = false;
        const colonIndex = text.indexOf(':');
        if (colonIndex > -1) {
          explanationFromLlm = text.substring(colonIndex + 1).trim();
        } else {
           explanationFromLlm = "Odpowiedź jest niepoprawna, ale nie udało się uzyskać szczegółowego wyjaśnienia.";
        }
      } else {
        console.warn("Nieoczekiwany format odpowiedzi LLM:", text);
        isVerifiedCorrect = false;
        explanationFromLlm = "Nie udało się zweryfikować odpowiedzi. Spróbuj ponownie.";
      }
      
      setLlmExplanation(explanationFromLlm);
      setIsCorrect(isVerifiedCorrect);
      onComplete(isVerifiedCorrect);

    } catch (error) {
      console.error('Weryfikacja nie powiodła się:', error);
      setIsCorrect(false);
      setLlmExplanation("Wystąpił błąd podczas weryfikacji odpowiedzi.");
      onComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isCorrect === true;

  return (
    <div className="do-task-component max-w-2xl mx-auto mb-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        {/* Status indicator */}
        {isCorrect !== null && (
          <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${isCorrect ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-semibold">Świetnie! Twoje rozwiązanie jest poprawne!</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-semibold">Spróbuj ponownie</span>
              </>
            )}
          </div>
        )}

        {/* Task */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Treść zadania:</h4>
          <p className="text-xl font-semibold leading-relaxed">{task}</p>
        </div>

        {/* Answer textarea */}
        <div className="relative mb-4">
          <label htmlFor="dotask-answer" className="text-sm font-semibold text-muted-foreground mb-2 block">
            Twoja odpowiedź:
          </label>
          <textarea
            id="dotask-answer"
            value={userInput}
            onChange={(e) => {
              if (isDisabled) return;
              setUserInput(e.target.value);
              setIsCorrect(null);
              setLlmExplanation(null);
            }}
            className={`w-full border-2 rounded-lg p-4 pr-16 text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 resize-none
              ${isDisabled
                ? "border-emerald-300 bg-emerald-50/50 cursor-not-allowed text-muted-foreground"
                : isCorrect === null
                  ? "border-border bg-background focus:border-primary"
                  : "border-red-300 bg-red-50/50 focus:border-red-500"
              }`}
            placeholder="Wpisz swoje rozwiązanie..."
            rows={4}
            disabled={isDisabled}
          />
          
          {!isDisabled && (
            <div className="absolute right-2 bottom-2">
              {isLoading ? (
                <div className="p-2">
                  <ProgressSpinner />
                </div>
              ) : (
                <button
                  onClick={handleCheck}
                  disabled={!userInput.trim()}
                  className={`p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                    ${userInput.trim() 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-95" 
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                    }`}
                  title="Sprawdź swoją odpowiedź"
                  aria-label="Sprawdź odpowiedź"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* LLM Explanation for incorrect answer */}
        {isCorrect === false && llmExplanation && (
          <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 leading-relaxed">
                <span className="font-semibold">Wskazówka od AI: </span>
                {llmExplanation}
              </p>
            </div>
          </div>
        )}

        {/* Optional hint */}
        {hint && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 leading-relaxed">
              <span className="font-semibold">Wskazówka: </span>
              {hint}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoTaskComponent;
