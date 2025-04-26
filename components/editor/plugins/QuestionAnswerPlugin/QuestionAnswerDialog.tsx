import { LexicalEditor } from 'lexical';
import * as React from 'react';
import { useState } from 'react';
import { INSERT_QA_COMMAND } from '.';


export function QuestionAnswerDialog({
  activeEditor, onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const handleOnClick = () => {
    activeEditor.dispatchCommand(INSERT_QA_COMMAND, { question, answer, explanation });
    onClose();
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-[1fr_3fr] gap-4 items-start mb-4"> {/* Changed items-center to items-start for better label alignment */}
        {/* Question */}
        <label className="text-sm font-medium text-gray-700 text-left pt-2">Pytanie:</label> {/* Added pt-2 for alignment */}
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 resize-y min-h-[60px]" // Added resize-y and min-h
          placeholder="Wpisz swoje pytanie"
          rows={3} // Added rows attribute
        />
        {/* Answer */}
        <label className="text-sm font-medium text-gray-700 text-left pt-2">Odpowiedź:</label> {/* Added pt-2 for alignment */}
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 resize-y min-h-[60px]" // Added resize-y and min-h
          placeholder="Wpisz poprawną odpowiedź"
          rows={3} // Added rows attribute
        />
         {/* Explanation */}
        <label className="text-sm font-medium text-gray-700 text-left pt-2">Wyjaśnienie:</label> {/* Added pt-2 for alignment */}
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 resize-y min-h-[60px]" // Added resize-y and min-h
          placeholder="Wpisz wyjaśnienie (opcjonalnie)"
          rows={3} // Added rows attribute
        />
      </div>

      <div className="flex justify-end space-x-4">
        {/* Confirm Button */}
        <button
          disabled={question.trim() === '' || answer.trim() === ''}
          onClick={handleOnClick}
          className={`px-4 py-2 rounded-md text-white ${
            question.trim() === '' || answer.trim() === ''
              ? 'bg-gray-400 cursor-not-allowed' // Added cursor-not-allowed
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          Potwierdź
        </button>
        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          Anuluj
        </button>
      </div>
    </div>
  );
}
