import { LexicalEditor } from "lexical";
import React, { useState } from "react";
import { TodoItem } from "../../nodes/TodoNode/TodoComponent";
import { INSERT_TODO_COMMAND } from ".";

export function InsertTodoDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [title, setTitle] = useState("Lista zadań");
  const [items, setItems] = useState<TodoItem[]>([]);
  const [newText, setNewText] = useState("");

  const handleAddItem = () => {
    if (newText.trim() === "") return;
    setItems((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), text: newText.trim(), checked: false },
    ]);
    setNewText("");
  };

  const handleCreate = () => {
    if (title.trim() === "" || items.length === 0) return;
    activeEditor.dispatchCommand(
      // Use the command from the plugin
      INSERT_TODO_COMMAND,
      { title: title.trim(), items }
    );
    onClose();
  };

  return (
    <div className="p-4 space-y-4 w-full max-w-lg md:max-w-none md:w-[820px] lg:w-[980px] mx-auto">
      <div className="mb-2 text-lg font-bold text-orange-700">Nowa lista zadań</div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-gray-300 rounded-md p-2 mb-2"
        placeholder="Tytuł listy (np. Zadania domowe, To Do, Lista)"
      />
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Dodaj zadanie</label>
        <div className="flex flex-col gap-2">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 resize-y min-h-[160px]"
            placeholder="Nowe zadanie..."
            rows={6}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddItem(); } }}
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddItem}
              className="px-4 py-2 rounded-md bg-orange-600 text-white font-bold hover:bg-orange-700"
            >
              Dodaj
            </button>
          </div>
        </div>
      </div>
      {items.length > 0 && (
        <ul className="list-disc list-inside space-y-1 mb-2">
          {items.map((item, idx) => (
            <li key={item.id} className="text-sm text-orange-900">{item.text}</li>
          ))}
        </ul>
      )}
      <div className="flex justify-between space-x-4 mt-4">
        <button
          onClick={handleCreate}
          disabled={title.trim() === "" || items.length === 0}
          className={`px-4 py-2 rounded-md text-white ${title.trim() !== "" && items.length > 0 ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"}`}
        >
          Utwórz listę
        </button>
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
