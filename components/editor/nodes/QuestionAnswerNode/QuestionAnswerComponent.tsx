import React, { useState } from "react";
import { set } from "zod";
import ProgressSpinner from "../../plugins/TextGeneratorPlugin/ProgressComponent";

export type QAType = {
  question: string;
  answer: string;
  explanation: string | null;
};

function QuestionAnswerComponent({ question, answer, explanation }: QAType) {
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = () => {
    if(!userInput.trim()){
      return;
    }
    setIsLoading(true);
    fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userPrompt: ``,
        systemPrompt: `verify correctness of answer based on question and explaination as context. be concise.
        ###
        question: ${question}
        ###
        answer: ${userInput.trim()}
        ###
        explaination: ${explanation}
        ###
        answer by exactly one word (no more) true or false.`,
      }),
    })
    .then((response) => response.text())
    .then((text) => {
      setIsCorrect(text === 'true');
    }).catch((error) => 
    {
      setIsCorrect(false);
      console.error('Verification failed:', error);
    });

    setIsLoading(false);
    
  };

  return (
    <div className="mb-4">
      {/* Pytanie */}
      <p className="text-gray-800 font-bold mb-2 text-xl">{question}</p>

      {/* Pole tekstowe z ikonami wewnątrz */}
      <div className="relative">
        <input
          type="text"
          value={userInput}
          onChange={(e) => {
            setUserInput(e.target.value);
            setIsCorrect(null); // Resetowanie poprawności podczas pisania
            setShowAnswer(false); // Ukrywanie odpowiedzi podczas pisania
          }}
          className={`w-full border rounded-md p-2 pr-16 focus:outline-none ${
            isCorrect === null
              ? "border-gray-300"
              : isCorrect
              ? "border-green-500"
              : "border-red-500"
          }`}
          placeholder="Twoja odpowiedź"
        />
        {isLoading ? (<ProgressSpinner />) : (
        <button
          onClick={handleCheck}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-blue-600"
          title="Sprawdź swoją odpowiedź"
        >❓
        </button>)}
          
          
        {/* Przycisk Pokaż/Ukryj odpowiedź */}
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-blue-600"
          title={showAnswer ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}
        >
          {showAnswer ? "🙈" : "👁️"}
        </button>
      </div>

      {/* Informacja zwrotna o poprawności */}
      {isCorrect !== null && (
        <p
          className={`mt-2 text-sm font-medium ${
            isCorrect ? "text-green-600" : "text-red-600"
          }`}
        >
          {isCorrect ? "Super!" : "Niestety musisz spróbować jeszcze raz!"}
        </p>
      )}

      {/* Wyświetlanie odpowiedzi i wyjaśnienia */}
      {(showAnswer || isCorrect) && (
        <div className="mt-2">
          <p className="text-sm text-blue-600">
            <strong>Odpowiedź</strong> {answer}
          </p>
          {explanation && (
            <p className="text-sm text-gray-700 mt-1">
              <strong>Wyjaśnienie / Wskazówka</strong> {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionAnswerComponent;
