import React, { useState } from "react";
import ProgressSpinner from "../../plugins/TextGeneratorPlugin/ProgressComponent";
import { DoTaskType } from "../../plugins/TaskPlugin";

function DoTaskComponent({ task, hint }: DoTaskType) {
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
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
        systemPrompt: `verify correctness of task based on instruction. be concise.
        ###
        question: ${task}
        ###
        answer: ${userInput.trim()}
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
      <p className="text-gray-800 font-bold mb-2 text-xl">{task}</p>

      {/* Pole tekstowe z ikonami wewnątrz */}
      <div className="relative">
        <textarea
          value={userInput}
          onChange={(e) => {
        setUserInput(e.target.value);
        setIsCorrect(null); // Resetowanie poprawności podczas pisania
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
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-orange-600"
          title="Sprawdź swoją odpowiedź"
        >❓
        </button>)}
        
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
    </div>
  );
}

export default DoTaskComponent;
