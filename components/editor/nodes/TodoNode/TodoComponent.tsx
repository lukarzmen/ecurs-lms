import React, { useState, useEffect, useRef } from "react";

export interface TodoItem {
  id: string;
  text: string;
  checked: boolean;
}

interface TodoComponentProps {
  title: string;
  initialItems: TodoItem[];
  onComplete: (completed: boolean) => void;
}

export default function TodoComponent({ title, initialItems, onComplete }: TodoComponentProps) {
  const [items, setItems] = useState<TodoItem[]>(initialItems);
  const completedOnceRef = useRef(false);

  useEffect(() => {
    if (!completedOnceRef.current) {
      const allChecked = items.length > 0 && items.every((item) => item.checked);
      if (allChecked) {
        completedOnceRef.current = true;
        onComplete(true);
      }
    }
  }, [items, onComplete]);

  const handleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <div className="flex justify-center w-full">
      <div className="p-6 w-full max-w-2xl border border-orange-200 rounded-2xl shadow bg-orange-50/80">
        <div className="text-lg font-bold text-orange-700 mb-4 text-center">{title}</div>
        <ul className="space-y-2 mb-4">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleCheck(item.id)}
                className="accent-orange-600 w-5 h-5"
              />
              <span className={item.checked ? "line-through text-gray-400" : "text-orange-900"}>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
