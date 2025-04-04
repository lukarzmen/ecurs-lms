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
      <div className="grid grid-cols-[1fr_3fr] gap-4 items-center mb-4">
        {/* Question */}
        <label className="text-sm font-medium text-gray-700 text-left">Pytanie:</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Wpisz swoje pytanie"
        />
        {/* Answer */}
        <label className="text-sm font-medium text-gray-700 text-left">Odpowiedź:</label>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Wpisz poprawną odpowiedź"
        />
         {/* Explanation */}
        <label className="text-sm font-medium text-gray-700 text-left">Wyjaśnienie:</label>
        <input
          type="text"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Wpisz wyjaśnienie (opcjonalnie)"
        />
      </div>

      <div className="flex justify-end space-x-4">
        {/* Confirm Button */}
        <button
          disabled={question.trim() === '' || answer.trim() === ''}
          onClick={handleOnClick}
          className={`px-4 py-2 rounded-md text-white ${
            question.trim() === '' || answer.trim() === ''
              ? 'bg-gray-400'
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
