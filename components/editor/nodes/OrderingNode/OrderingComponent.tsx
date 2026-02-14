import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Eye } from "lucide-react";

export interface OrderingItem {
  id: string;
  text: string;
}

interface OrderingComponentProps {
  items: OrderingItem[];
  initialCompleted: boolean;
  onComplete: (isCorrect: boolean) => void;
}

function shuffleItems(items: OrderingItem[]): OrderingItem[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function normalizeItems(items: OrderingItem[]): OrderingItem[] {
  return items
    .map((item, index) => {
      const text = typeof item?.text === "string" ? item.text.trim() : "";
      if (!text) return null;
      const id = typeof item?.id === "string" && item.id.trim()
        ? item.id.trim()
        : `ordering-${index}-${text.slice(0, 12)}`;
      return { id, text };
    })
    .filter(Boolean) as OrderingItem[];
}

function isSameOrder(current: OrderingItem[], expected: OrderingItem[]): boolean {
  if (current.length !== expected.length) return false;
  for (let i = 0; i < current.length; i += 1) {
    if (current[i].id !== expected[i].id) return false;
  }
  return true;
}

export default function OrderingComponent({
  items,
  initialCompleted,
  onComplete,
}: OrderingComponentProps) {
  const correctItems = useMemo(() => normalizeItems(items), [items]);
  const [currentOrder, setCurrentOrder] = useState<OrderingItem[]>([]);
  const [revealed, setRevealed] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const lastReportedRef = useRef<boolean | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (correctItems.length === 0) {
      setCurrentOrder([]);
      setRevealed(false);
      return;
    }

    const nextOrder = initialCompleted
      ? correctItems
      : shuffleItems(correctItems);
    setCurrentOrder(nextOrder);
    setRevealed(initialCompleted);
  }, [correctItems, initialCompleted]);

  const isCorrectNow = useMemo(
    () => isSameOrder(currentOrder, correctItems),
    [currentOrder, correctItems],
  );

  useEffect(() => {
    if (correctItems.length === 0) {
      if (lastReportedRef.current !== false) {
        onCompleteRef.current(false);
        lastReportedRef.current = false;
      }
      return;
    }
    if (lastReportedRef.current !== isCorrectNow) {
      onCompleteRef.current(isCorrectNow);
      lastReportedRef.current = isCorrectNow;
    }
  }, [correctItems.length, isCorrectNow]);

  const isLocked = initialCompleted || revealed || isCorrectNow;

  const moveItem = (from: number, to: number) => {
    setCurrentOrder((prev) => {
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  const revealAnswer = () => {
    setCurrentOrder(correctItems);
    setRevealed(true);
    onCompleteRef.current(true);
    lastReportedRef.current = true;
  };

  return (
    <div className="ordering-component max-w-2xl mx-auto">
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Ułóż kolejność
              </div>
              <h3 className="mt-2 text-lg font-semibold leading-relaxed">
                Ustaw elementy w poprawnej kolejności
              </h3>
            </div>
            {isCorrectNow && (
              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Poprawnie
              </div>
            )}
          </div>

          {currentOrder.length === 0 ? (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              Brak elementów do ułożenia.
            </div>
          ) : (
            <div className="space-y-3">
              {currentOrder.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 text-sm font-medium leading-relaxed">
                    {item.text}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, index - 1)}
                      disabled={isLocked || index === 0}
                      className="rounded-md border px-2 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Przesuń w górę"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, index + 1)}
                      disabled={isLocked || index === currentOrder.length - 1}
                      className="rounded-md border px-2 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Przesuń w dół"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={revealAnswer}
              disabled={isLocked || correctItems.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Eye className="h-4 w-4" />
              Pokaż poprawną kolejność
            </button>
            {!isCorrectNow && !revealed && (
              <div className="text-xs text-muted-foreground">
                Ułóż elementy we właściwej kolejności.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
