import React, { useEffect, useState, useMemo } from "react"; // Added useMemo
import { useSwipeable } from "react-swipeable";
import Confetti from "react-confetti";
import { ChevronLeft, ChevronRight, Plus, X, Table, Shuffle, BookOpen, Trophy } from "lucide-react";

export interface Dictionary {
  [Key: string]: string;
}

interface DictionaryComponentProps {
  dictionary: Dictionary;
  onDictionaryChanged: (dictionaryValue: Dictionary) => void;
  isReadonly?: boolean;
  initialCompleted: boolean; // Receive initial state
  onComplete: (isCorrect: boolean) => void; // Callback to update node
}

export const DictionaryComponent: React.FC<DictionaryComponentProps> = ({
    dictionary,
    onDictionaryChanged,
    isReadonly,
    onComplete // Use callback
}) => {
  // Derive entries from the dictionary prop instead of keeping separate state
  const currentEntries = useMemo(() => Object.entries(dictionary), [dictionary]);

  const [view, setView] = useState<"flashView" | "dictionaryView" | "matchGameView">(isReadonly ? "flashView" : "dictionaryView");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isSliding, setIsSliding] = useState(false);

  // Removed handleDictionaryValueChanged - call onDictionaryChanged directly

  const COLOR_STYLES = [
    { bg: '#eab308', text: '#fff' }, // yellow-500
    { bg: '#22c55e', text: '#fff' }, // green-500
    { bg: '#f97316', text: '#fff' }, // orange-500
    { bg: '#3b82f6', text: '#fff' }, // blue-500
    { bg: '#a855f7', text: '#fff' }, // purple-500
    { bg: '#ec4899', text: '#fff' }, // pink-500
  ];

  const TAILWIND_COLORS = [
    "bg-yellow-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
  ];

  // --- Dictionary View State & Handlers ---
  const handleInputChange = (index: number, type: 'key' | 'value', value: string) => {
    // Create the new dictionary based on the change
    const updatedEntries = currentEntries.map((entry, i) => {
        if (i === index) {
            return type === 'key' ? [value, entry[1]] : [entry[0], value];
        }
        return entry;
    });
    const newDictionary = Object.fromEntries(updatedEntries);
    onDictionaryChanged(newDictionary); // Update node state directly
  };

  const handleAddRow = (atTop: boolean = false) => {
    const newRow: [string, string] = ["", ""];
    const updatedEntries = atTop ? [newRow, ...currentEntries] : [...currentEntries, newRow];
    const newDictionary = Object.fromEntries(updatedEntries);
    onDictionaryChanged(newDictionary); // Update node state directly
  };

  const handleRemoveRow = (index: number) => {
    const updatedEntries = currentEntries.filter((_, i) => i !== index);
    const newDictionary = Object.fromEntries(updatedEntries);
    onDictionaryChanged(newDictionary); // Update node state directly
  };

  // --- Flashcard View State & Handlers ---
  const handlePrevious = () => {
    if (currentEntries.length === 0) return;
    setSlideDirection('left');
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        const newIndex = prevIndex > 0 ? prevIndex - 1 : currentEntries.length - 1;
        setCurrentColorIndex((prevColorIndex) => (prevColorIndex > 0 ? prevColorIndex - 1 : TAILWIND_COLORS.length - 1));
        return newIndex;
      });
      setIsSliding(false);
      setSlideDirection(null);
    }, 300);
  };

  const handleNext = () => {
    if (currentEntries.length === 0) return;
    setSlideDirection('right');
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        const newIndex = prevIndex < currentEntries.length - 1 ? prevIndex + 1 : 0;
        setCurrentColorIndex((prevColorIndex) => (prevColorIndex < TAILWIND_COLORS.length - 1 ? prevColorIndex + 1 : 0));
        return newIndex;
      });
      setIsSliding(false);
      setSlideDirection(null);
    }, 300);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    trackMouse: true,
  });

  // --- Match Game State & Handlers ---
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const [selectedValueIndex, setSelectedValueIndex] = useState<number | null>(null);
  const [matches, setMatches] = useState<{ [entryIndex: number]: number }>({});
  const [tempColor, setTempColor] = useState<{ keyIndex?: number | 'error'; valueIndex?: number | 'error' }>({});
  const [shuffledKeys, setShuffledKeys] = useState<[string, number][]>([]); // [key, originalIndex]
  const [shuffledValues, setShuffledValues] = useState<[string, number][]>([]); // [value, originalIndex]
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<[string, string][]>([]);

  const getRandomColorIndex = () => {
    const usedIndices = new Set(Object.values(matches).filter(v => typeof v === 'number'));
    const availableIndices = COLOR_STYLES.map((_, i) => i).filter(i => !usedIndices.has(i));
    return availableIndices.length > 0 ? availableIndices[Math.floor(Math.random() * availableIndices.length)] : 0;
  };

  // Use currentEntries derived from props
  const getRandomSubset = (count: number = 5) => {
    const validEntries = currentEntries.filter(([key, value]) => key.trim() !== "" && value.trim() !== "");
    const shuffled = [...validEntries].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, validEntries.length)); // Ensure count doesn't exceed available entries
  };

  const initializeMatchGame = () => {
    const newSubset = getRandomSubset();
    if (newSubset.length === 0) { 
        setSelectedEntries([]);
        setShuffledKeys([]);
        setShuffledValues([]);
    } else {
        setSelectedEntries(newSubset);
        // Create shuffled arrays with original indices
        const keysWithIndex: [string, number][] = newSubset.map(([key], index) => [key, index]);
        const valuesWithIndex: [string, number][] = newSubset.map(([_, value], index) => [value, index]);
        setShuffledKeys(keysWithIndex.sort(() => Math.random() - 0.5));
        setShuffledValues(valuesWithIndex.sort(() => Math.random() - 0.5));
    }
    setMatches({});
    setTempColor({});
    setSelectedKeyIndex(null);
    setSelectedValueIndex(null);
    setShowConfetti(false);
    onComplete(false);
  };

  // Initialize game when view changes or dictionary data changes
  useEffect(() => {
    if (view === "matchGameView") {
      initializeMatchGame();
    }
    // Reset flashcard index when dictionary changes
    setCurrentIndex(0);
    setCurrentColorIndex(0);
    // No need to update local 'entries' state as it's derived now
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, dictionary]); // Rerun if dictionary data changes externally

  // Removed useEffect that synced dictionary prop to local entries state

  const handleSelection = (entryIndex: number, isKey: boolean) => {
    // Prevent interaction if already matched
    if (matches[entryIndex] !== undefined) return;

    if (isKey) {
      if (selectedKeyIndex === entryIndex) { // Deselect if clicking the same key
          setSelectedKeyIndex(null);
          setTempColor({});
      } else if (selectedKeyIndex === null) { // Select a key
          setSelectedKeyIndex(entryIndex);
          setTempColor({ keyIndex: getRandomColorIndex() });
      }
    } else { // It's a value
      if (selectedValueIndex === entryIndex) { // Deselect if clicking the same value
          setSelectedValueIndex(null);
          setTempColor({});
      } else if (selectedValueIndex === null && selectedKeyIndex !== null) { // Select a value only if a key is selected
          if (selectedKeyIndex === entryIndex) { // Correct match!
              const assignedColorIndex = tempColor.keyIndex;
              if (typeof assignedColorIndex === 'number') {
                setMatches((prev) => ({ ...prev, [entryIndex]: assignedColorIndex }));
              }
              setTempColor({});
              setSelectedKeyIndex(null);
              setSelectedValueIndex(null);
          } else { // Incorrect match
              setTempColor({ keyIndex: 'error', valueIndex: 'error' });
              setSelectedKeyIndex(null);
              setSelectedValueIndex(null);
              setTimeout(() => setTempColor({}), 1000);
          }
      }
    }
  };

  const baseColor = "bg-gray-200";

  // Check for game completion
  useEffect(() => {
    // Check if all selected entries are matched and there are entries to match
    const allMatched = selectedEntries.length > 0 && Object.keys(matches).length === selectedEntries.length;
    if (allMatched && view === "matchGameView") {
      // Only trigger confetti and completion if not already completed in this render cycle
      if (!showConfetti) {
          setShowConfetti(true);
          onComplete(true); // <<<<<< UPDATE NODE STATE HERE
          setTimeout(() => setShowConfetti(false), 7000);
      }
    }
  }, [matches, selectedEntries, view, onComplete, showConfetti]); // Added showConfetti dependency


  const matchedPairs = Object.keys(matches).length;
  const totalPairs = selectedEntries.length;
  const progressPercentage = totalPairs > 0 ? (matchedPairs / totalPairs) * 100 : 0;

  return (
    <div className="dictionary-component max-w-4xl mx-auto pt-4">
      {showConfetti && <Confetti />}

      {/* Match Game View */}
      {view === "matchGameView" && (
        <div className="flex flex-col items-center">
          {selectedEntries.length > 0 ? (
            <div className="w-full">
              {/* Header with progress */}
              <div className="mb-6 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Gra w dopasowywanie</h3>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {matchedPairs}/{totalPairs} par
                  </span>
                </div>
                <div className="mb-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ease-out ${
                        matchedPairs === totalPairs ? 'bg-emerald-500' : 'bg-primary'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Dopasuj słowa po lewej stronie do tłumaczeń po prawej</p>
              </div>

              {/* Game grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Left Side (Shuffled Keys) */}
                <div className="flex flex-col space-y-3">
                  {shuffledKeys.map(([key, entryIndex]) => {
                    const isMatched = matches[entryIndex] !== undefined;
                    const isSelected = selectedKeyIndex === entryIndex;
                    const colorIndex = matches[entryIndex] ?? tempColor.keyIndex;
                    const isError = tempColor.keyIndex === 'error';
                    
                    let style = {};
                    let className = 'p-4 rounded-lg border-2 text-center font-medium cursor-pointer select-none transition-all duration-300';
                    
                    if (isMatched && typeof colorIndex === 'number') {
                      style = { backgroundColor: COLOR_STYLES[colorIndex].bg, color: COLOR_STYLES[colorIndex].text };
                      className += ' border-transparent';
                    } else if (isError) {
                      style = { backgroundColor: '#ef4444', color: '#fff' };
                      className += ' border-transparent';
                    } else if (isSelected) {
                      className += ' bg-primary text-primary-foreground border-primary shadow-lg scale-105';
                    } else {
                      className += ' bg-card border-border hover:border-primary/50 hover:shadow-md active:scale-95';
                    }
                    
                    return (
                      <button
                        key={`key-${entryIndex}`}
                        className={className}
                        style={style}
                        onClick={() => handleSelection(entryIndex, true)}
                        disabled={isMatched}
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
                {/* Right Side (Shuffled Values) */}
                <div className="flex flex-col space-y-3">
                  {shuffledValues.map(([value, entryIndex]) => {
                    const isMatched = matches[entryIndex] !== undefined;
                    const isSelected = selectedValueIndex === entryIndex;
                    const colorIndex = matches[entryIndex] ?? tempColor.valueIndex;
                    const isError = tempColor.valueIndex === 'error';
                    
                    let style = {};
                    let className = 'p-4 rounded-lg border-2 text-center font-medium cursor-pointer select-none transition-all duration-300';
                    
                    if (isMatched && typeof colorIndex === 'number') {
                      style = { backgroundColor: COLOR_STYLES[colorIndex].bg, color: COLOR_STYLES[colorIndex].text };
                      className += ' border-transparent';
                    } else if (isError) {
                      style = { backgroundColor: '#ef4444', color: '#fff' };
                      className += ' border-transparent';
                    } else if (isSelected) {
                      className += ' bg-primary text-primary-foreground border-primary shadow-lg scale-105';
                    } else {
                      className += ' bg-card border-border hover:border-primary/50 hover:shadow-md active:scale-95';
                    }
                    
                    return (
                      <button
                        key={`value-${entryIndex}`}
                        className={className}
                        style={style}
                        onClick={() => handleSelection(entryIndex, false)}
                        disabled={isMatched}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shuffle button */}
              <div className="flex justify-center">
                <button
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 font-semibold active:scale-95"
                  onClick={initializeMatchGame}
                >
                  <Shuffle className="h-5 w-5" />
                  Wylosuj ponownie
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
              <p className="text-muted-foreground">Dodaj wpisy w widoku tabeli, aby zagrać</p>
            </div>
          )}
        </div>
      )}

      {/* Dictionary View */}
      {view === "dictionaryView" && !isReadonly && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Table className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Edycja słowniczka</h3>
            </div>
            <button
              onClick={() => handleAddRow(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span className="font-medium">Dodaj na górze</span>
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {currentEntries.map(([keyword, definition], index) => (
              <div key={index} className="flex gap-3 items-start">
                <button
                  onClick={() => handleRemoveRow(index)}
                  className="mt-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 flex-shrink-0 active:scale-95"
                  title="Usuń wiersz"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => handleInputChange(index, 'key', e.target.value)}
                    placeholder="Słowo kluczowe"
                    className="px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-primary bg-background font-medium transition-all duration-200"
                  />
                  <input
                    type="text"
                    value={definition}
                    onChange={(e) => handleInputChange(index, 'value', e.target.value)}
                    placeholder="Definicja / tłumaczenie"
                    className="px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-primary bg-background font-medium transition-all duration-200"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => handleAddRow(false)}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm font-semibold active:scale-[0.99]"
          >
            <Plus className="h-5 w-5" />
            Dodaj wiersz na dole
          </button>
        </div>
      )}

      {/* Flashcard View */}
      {view === "flashView" && (
        <div className="flex flex-col items-center" {...swipeHandlers}>
          {currentEntries.length > 0 ? (
            <>
              {/* Card counter */}
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>{currentIndex + 1} / {currentEntries.length}</span>
              </div>

              {/* Flashcard */}
              <div className="relative w-full max-w-md">
                <div
                  className={`rounded-lg border bg-card shadow-lg p-8 text-center flex flex-col justify-center items-center min-h-[250px] transition-all duration-300 ${isSliding ? (slideDirection === 'right' ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0') : 'opacity-100 scale-100'}`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="text-3xl font-bold text-foreground mb-6 select-none">
                    {currentEntries[currentIndex]?.[0] ?? ''}
                  </div>
                  <div className="h-px w-20 bg-border mb-6"></div>
                  <div className="text-xl text-muted-foreground select-none">
                    {currentEntries[currentIndex]?.[1] ?? ''}
                  </div>
                </div>

                {/* Navigation buttons */}
                <button
                  onClick={handlePrevious}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 p-3 bg-card border-2 border-border rounded-full hover:bg-accent hover:border-primary/50 transition-all duration-200 shadow-lg active:scale-95"
                  title="Poprzednia fiszka"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 p-3 bg-card border-2 border-border rounded-full hover:bg-accent hover:border-primary/50 transition-all duration-200 shadow-lg active:scale-95"
                  title="Następna fiszka"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mt-6 select-none">
                Przesuń lub użyj strzałek, aby zmienić fiszkę
              </p>
            </>
          ) : (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
              <p className="text-muted-foreground">Brak fiszek do wyświetlenia</p>
            </div>
          )}
        </div>
      )}

      {/* View Switch Buttons */}
      <div className="flex justify-center flex-wrap gap-3 mt-8">
          {!isReadonly && view !== "dictionaryView" && (
              <button 
                onClick={() => setView("dictionaryView")} 
                className="px-6 py-3 bg-card border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-200 flex items-center gap-2 font-semibold shadow-sm active:scale-95"
              >
                <Table className="h-5 w-5" />
                Widok tabeli
              </button>
          )}
          {view !== "flashView" && (
              <button 
                onClick={() => setView("flashView")} 
                className="px-6 py-3 bg-card border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-200 flex items-center gap-2 font-semibold shadow-sm active:scale-95"
              >
                <BookOpen className="h-5 w-5" />
                Fiszki
              </button>
          )}
          {view !== "matchGameView" && (
              <button 
                onClick={() => setView("matchGameView")} 
                className="px-6 py-3 bg-card border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-200 flex items-center gap-2 font-semibold shadow-sm active:scale-95"
              >
                <Trophy className="h-5 w-5" />
                Gra w dopasowywanie
              </button>
          )}
      </div>
    </div>
  );
};
