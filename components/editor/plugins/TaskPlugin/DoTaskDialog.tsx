import { LexicalEditor } from 'lexical';
import * as React from 'react';
import { useState } from 'react';
import { INSERT_TASK_COMMAND } from '.';


export function DoTaskDialog({
  activeEditor, onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [task, setQuestion] = useState('');
  const [hint, setHint] = useState(''); 
  const handleOnClick = () => {
    activeEditor.dispatchCommand(INSERT_TASK_COMMAND, { task, hint });
    onClose();
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-[1fr_3fr] gap-4 items-center mb-4">
        {/* Question */}
        <label className="text-sm font-medium text-gray-700 text-left">Zadanie:</label>
        <textarea
          value={task}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Zadanie"
        />
         {/* Explanation */}
        <label className="text-sm font-medium text-gray-700 text-left">Wskazówki:</label>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Wpisz wskazówki (opcjonalnie)"
        />
      </div>

      <div className="flex justify-end space-x-4">
        {/* Confirm Button */}
        <button
          disabled={task.trim() === ''}
          onClick={handleOnClick}
          className={`px-4 py-2 rounded-md text-white ${
            task.trim() === ''
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
