import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, Circle, ListTodo } from "lucide-react";

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

  const completedCount = items.filter(item => item.checked).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  return (
    <div className="flex justify-center w-full">
      <div className="todo-component max-w-2xl w-full mx-auto mb-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          {/* Header with icon and title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <ListTodo className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold flex-1">{title}</h3>
            <span className="text-sm font-medium text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mb-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ease-out ${
                    allCompleted ? 'bg-emerald-500' : 'bg-primary'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Completion status */}
          {allCompleted && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-semibold">Wszystkie zadania wykonane!</span>
            </div>
          )}

          {/* Todo items */}
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleCheck(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left
                    ${item.checked
                      ? "bg-muted/50 border-muted"
                      : "bg-card border-border hover:border-primary/50 hover:bg-accent hover:shadow-sm active:scale-[0.99]"
                    }`}
                >
                  {item.checked ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={`font-medium transition-all duration-200 ${
                    item.checked 
                      ? "line-through text-muted-foreground" 
                      : "text-foreground"
                  }`}>
                    {item.text}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
