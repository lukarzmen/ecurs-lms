import React, { useEffect, useState, useMemo } from "react"; // Added useMemo
import { useSwipeable } from "react-swipeable";
import Confetti from "react-confetti";

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

  const TAILWIND_COLORS = [
    "bg-yellow-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-blue-500", // Changed one orange to blue for variety
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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [matches, setMatches] = useState<{ [key: string]: string }>({});
  const [tempColor, setTempColor] = useState<{ [key: string]: string }>({});
  const [shuffledKeys, setShuffledKeys] = useState<string[]>([]);
  const [shuffledValues, setShuffledValues] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<[string, string][]>([]);

  const getRandomColor = () => {
    const availableColors = TAILWIND_COLORS.filter(color => !Object.values(matches).includes(color));
    return availableColors.length > 0 ? availableColors[Math.floor(Math.random() * availableColors.length)] : "bg-gray-400";
  };

  // Use currentEntries derived from props
  const getRandomSubset = (count: number = 5) => {
    const validEntries = currentEntries.filter(([key, value]) => key.trim() !== "" && value.trim() !== "");
    const shuffled = [...validEntries].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, validEntries.length)); // Ensure count doesn't exceed available entries
  };

  const initializeMatchGame = () => {
    const newSubset = getRandomSubset();
    if (newSubset.length === 0) { // Handle case with no valid entries
        setSelectedEntries([]);
        setShuffledKeys([]);
        setShuffledValues([]);
    } else {
        setSelectedEntries(newSubset);
        setShuffledKeys([...newSubset.map(([key]) => key)].sort(() => Math.random() - 0.5));
        setShuffledValues([...newSubset.map(([_, value]) => value)].sort(() => Math.random() - 0.5));
    }
    setMatches({});
    setTempColor({});
    setSelectedKey(null);
    setSelectedValue(null);
    setShowConfetti(false); // Ensure confetti is off on reset
    // Reset node completion state when game restarts
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
  }, [view, dictionary]); // Rerun if dictionary data changes externally

  // Removed useEffect that synced dictionary prop to local entries state

  const handleSelection = (keyOrValue: string, isKey: boolean) => {
    // Prevent interaction if already matched
    if (matches[keyOrValue]) return;

    if (isKey) {
      if (selectedKey === keyOrValue) { // Deselect if clicking the same key
          setSelectedKey(null);
          setTempColor({}); // Clear temp color
      } else if (selectedKey === null) { // Select a key
          setSelectedKey(keyOrValue);
          setTempColor({ [keyOrValue]: getRandomColor() }); // Assign temp color
      }
      // If a value is already selected, ignore key click
    } else { // It's a value
      if (selectedValue === keyOrValue) { // Deselect if clicking the same value
          setSelectedValue(null);
          setTempColor({}); // Clear temp color
      } else if (selectedValue === null && selectedKey !== null) { // Select a value *only if* a key is selected
          // setSelectedValue(keyOrValue); // Don't set state here yet, check match first
          const originalEntry = selectedEntries.find(([k, v]) => k === selectedKey);

          if (originalEntry && originalEntry[1] === keyOrValue) { // Correct match!
              const assignedColor = tempColor[selectedKey]; // Use the key's temp color
              setMatches((prev) => ({ ...prev, [selectedKey]: assignedColor, [keyOrValue]: assignedColor }));
              setTempColor({}); // Clear temp colors
              setSelectedKey(null); // Reset selection
              setSelectedValue(null);
          } else { // Incorrect match
              setTempColor({ [selectedKey]: "bg-red-500", [keyOrValue]: "bg-red-500" });
              // Reset selection immediately on incorrect match
              setSelectedKey(null);
              setSelectedValue(null);
              setTimeout(() => setTempColor({}), 1000); // Clear temp colors after delay
          }
          // Removed redundant reset here
      }
      // If a key is not selected, ignore value click
    }
  };

  const baseColor = "bg-gray-200";

  // Check for game completion
  useEffect(() => {
    // Check if all selected entries are matched and there are entries to match
    const allMatched = selectedEntries.length > 0 && Object.keys(matches).length === selectedEntries.length * 2;
    if (allMatched && view === "matchGameView") {
      // Only trigger confetti and completion if not already completed in this render cycle
      if (!showConfetti) {
          setShowConfetti(true);
          onComplete(true); // <<<<<< UPDATE NODE STATE HERE
          setTimeout(() => setShowConfetti(false), 7000);
      }
    }
  }, [matches, selectedEntries, view, onComplete, showConfetti]); // Added showConfetti dependency


  return (
    <div className="pt-4">
      {showConfetti && <Confetti />}

      {/* Match Game View */}
      {view === "matchGameView" && (
        <div className="pt-4 flex flex-col items-center">
          {selectedEntries.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 w-80">
                {/* Left Side (Shuffled Keys) */}
                <div className="flex flex-col space-y-2">
                  {shuffledKeys.map((key) => (
                    <div
                      key={key}
                      className={`p-4 rounded-lg shadow text-center cursor-pointer select-none transition-colors duration-300 ${matches[key] || tempColor[key] || (selectedKey === key ? tempColor[key] : baseColor)}`}
                      onClick={() => handleSelection(key, true)}
                    >
                      {key}
                    </div>
                  ))}
                </div>
                {/* Right Side (Shuffled Values) */}
                <div className="flex flex-col space-y-2">
                  {shuffledValues.map((value) => (
                    <div
                      key={value}
                      className={`p-4 rounded-lg shadow text-center cursor-pointer select-none transition-colors duration-300 ${matches[value] || tempColor[value] || (selectedValue === value ? tempColor[value] : baseColor)}`}
                      onClick={() => handleSelection(value, false)}
                    >
                      {value}
                    </div>
                  ))}
                </div>
              </div>
              <span className="text-sm mt-2 text-gray-700 select-none">Dopasuj słowa po lewej stronie do tłumaczeń po prawej stronie</span>
              <button
                className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-700 select-none"
                onClick={initializeMatchGame}
              >
                Wylosuj ponownie
              </button>
            </>
          ) : (
              <p className="text-gray-500">Dodaj wpisy w widoku tabeli, aby zagrać.</p>
          )}
        </div>
      )}

      {/* Dictionary View */}
      {view === "dictionaryView" && !isReadonly && (
        <div>
            <button
              onClick={() => handleAddRow(true)} // Pass true for adding at top
              className="mt-4 mb-4 px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600"
            >
              Dodaj wiersz na górze
            </button>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left" style={{ width: "3rem" }}></th>
                <th className="border border-gray-300 px-4 py-2 text-left">Słowo kluczowe</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Definicja</th>
              </tr>
            </thead>
            <tbody>
              {/* Use currentEntries derived from props */}
              {currentEntries.map(([keyword, definition], index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button
                      onClick={() => handleRemoveRow(index)}
                      className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <span className="text-sm">-</span>
                    </button>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => handleInputChange(index, 'key', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-orange-200"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="text"
                      value={definition}
                      onChange={(e) => handleInputChange(index, 'value', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-orange-200"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => handleAddRow(false)} // Pass false or nothing for adding at bottom
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600"
          >
            Dodaj wiersz na dole
          </button>
        </div>
      )}

      {/* Flashcard View */}
      {view === "flashView" && (
        <div className="flex flex-col items-center" {...swipeHandlers}>
        {/* Use currentEntries derived from props */}
        {currentEntries.length > 0 ? (
            <>
                <div
                  className={`w-80 h-48 rounded-lg shadow-lg p-6 text-center flex flex-col justify-center items-center transition-transform duration-300 ${TAILWIND_COLORS[currentColorIndex % TAILWIND_COLORS.length]} ${isSliding ? (slideDirection === 'right' ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0') : 'opacity-100'}`}
                  style={{ backfaceVisibility: 'hidden' }} // Helps with smoother transitions
                >
                  <div className="text-2xl font-bold select-none">{currentEntries[currentIndex]?.[0] ?? ''}</div>
                  <div className="text-lg mt-4 select-none">{currentEntries[currentIndex]?.[1] ?? ''}</div>
                </div>
                <span className="text-sm mt-2 text-gray-700 select-none">Przesuń, aby zmienić słowo ({currentIndex + 1}/{currentEntries.length})</span>
            </>
        ) : (
            <p className="text-gray-500">Brak fiszek do wyświetlenia.</p>
        )}
      </div>
      )}

      {/* View Switch Buttons */}
      <div className="flex justify-center space-x-2 mt-4">
          {!isReadonly && view !== "dictionaryView" && (
              <button onClick={() => setView("dictionaryView")} className="min-w-[160px] bg-blue-500 text-white rounded-full hover:bg-blue-600 px-4 py-2 select-none">
                  Widok tabeli
              </button>
          )}
          {view !== "flashView" && (
              <button onClick={() => setView("flashView")} className="min-w-[160px] bg-orange-500 text-white rounded-full hover:bg-orange-600 px-4 py-2 select-none">
                  Fiszki
              </button>
          )}
          {view !== "matchGameView" && (
              <button onClick={() => setView("matchGameView")} className="min-w-[160px] bg-yellow-500 text-black rounded-full hover:bg-yellow-600 px-4 py-2 select-none">
                  Gra w dopasowywanie
              </button>
          )}
      </div>
    </div>
  );
};
