import React, { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import Confetti from "react-confetti";

interface DictionaryComponentProps {
  dictionary: Dictionary;
  onDictionaryChanged: (dictionaryValue: Dictionary) => void;
  isReadonly?: boolean;
}

export interface Dictionary {
  [Key: string]: string;
}

export const DictionaryComponent: React.FC<DictionaryComponentProps> = ({ dictionary, onDictionaryChanged, isReadonly }) => {
  const [entries, setEntries] = useState(Object.entries(dictionary));
  const [view, setView] = useState<"flashView" | "dictionaryView" | "matchGameView">(isReadonly ? "flashView" : "dictionaryView");
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  
  const handleDictionaryValueChanged = (entries: [string, string][]) => {
    const dictionary: Dictionary = Object.fromEntries(entries);
    console.log(dictionary);
    onDictionaryChanged(dictionary);
  }

  const TAILWIND_COLORS = [
    "bg-yellow-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
  ];

  const handleInputChange = (key: string, value: string) => {
    setEntries((prevEntries) =>
      prevEntries.map(([k, v]) => (k === key ? [k, value] : [k, v]))
    );
    handleDictionaryValueChanged(entries);
  };

  const handleAddRow = () => {
    setEntries((prevEntries) => [...prevEntries, ["", ""]]);
    handleDictionaryValueChanged(entries);
  };

  const handleRemoveRow = (index: number) => {
    setEntries((prevEntries) => prevEntries.filter((_, i) => i !== index));
    handleDictionaryValueChanged(entries);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex > 0 ? prevIndex - 1 : entries.length - 1;
      setCurrentColorIndex((prevColorIndex) => (prevColorIndex > 0 ? prevColorIndex - 1 : TAILWIND_COLORS.length - 1));
      return newIndex;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex < entries.length - 1 ? prevIndex + 1 : 0;
      setCurrentColorIndex((prevColorIndex) => (prevColorIndex < TAILWIND_COLORS.length - 1 ? prevColorIndex + 1 : 0));
      return newIndex;
    });
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    trackMouse: true,
  });

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
  
  const getRandomSubset = () => {
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  };

  const initializeMatchGame = () => {
    const newSubset = getRandomSubset();
    setSelectedEntries(newSubset);
    setShuffledKeys([...newSubset.map(([key]) => key)].sort(() => Math.random() - 0.5));
    setShuffledValues([...newSubset.map(([_, value]) => value)].sort(() => Math.random() - 0.5));
    setMatches({});
    setTempColor({});
    setSelectedKey(null);
    setSelectedValue(null);
  };

  useEffect(() => {
    if (view === "matchGameView") {
      initializeMatchGame();
    }
  }, [view]);

  const handleSelection = (keyOrValue: string, isKey: boolean) => {
    if (isKey) {
      if (selectedKey === null) {
        setSelectedKey(keyOrValue);
        setTempColor((prev) => ({ ...prev, [keyOrValue]: getRandomColor() }));
      }
    } else {
      if (selectedKey !== null && selectedValue === null) {
        setSelectedValue(keyOrValue);
        const originalKey = selectedEntries.find(([key, value]) => value === keyOrValue)?.[0];
        if (originalKey === selectedKey) {
          const assignedColor = tempColor[selectedKey];
          setMatches((prev) => ({ ...prev, [selectedKey]: assignedColor, [keyOrValue]: assignedColor }));
        } else {
          setTempColor({ [selectedKey]: "bg-red-500", [keyOrValue]: "bg-red-500" });
          setTimeout(() => setTempColor((prev) => {
            const newTemp = { ...prev };
            delete newTemp[selectedKey];
            delete newTemp[keyOrValue];
            return newTemp;
          }), 1000);
        }
        setSelectedKey(null);
        setSelectedValue(null);
      }
    }
  };

  const baseColor = "bg-gray-200";

  useEffect(() => {
    if (Object.keys(matches).length === selectedEntries.length * 2 && view == "matchGameView" && Object.keys(matches).length > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 7000);
    }
  }, [matches]);


  return (
    <div className="pt-12">
      {showConfetti && <Confetti />}
      {view == "matchGameView" && (
        <div className="pt-12 flex flex-col items-center">
      <div className="grid grid-cols-2 gap-4 w-80">
        {/* Left Side (Shuffled Keys) */}
        <div className="flex flex-col space-y-2">
          {shuffledKeys.map((key) => (
            <div
              key={key}
              className={`p-4 rounded-lg shadow text-center cursor-pointer select-none ${matches[key] || tempColor[key] || baseColor}`}
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
              className={`p-4 rounded-lg shadow text-center cursor-pointer select-none ${matches[value] || tempColor[value] || baseColor}`}
              onClick={() => handleSelection(value, false)}
            >
              {value}
            </div>
          ))}
        </div>
      </div>
      <span className="text-sm mt-2 text-gray-700 select-none">Match words on the left with translations on the right</span>
      <button
        className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-700"
        onClick={initializeMatchGame}
      >
        Reset Game
      </button>
    </div>)} 
    {view == "dictionaryView" && 
    (
        <div>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left" style={{ width: "3rem" }}></th>
                <th className="border border-gray-300 px-4 py-2 text-left">Keyword</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Definition</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([keyword, definition], index) => (
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
                      onChange={(e) => {
                        handleKeywordChanged();

                        function handleKeywordChanged() {
                          const newKeyword = e.target.value;
                          setEntries((prevEntries) => prevEntries.map((entry, i) => i === index ? [newKeyword, entry[1]] : entry
                          )
                          );
                          handleDictionaryValueChanged(entries);
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="text"
                      value={definition}
                      onChange={(e) => handleInputChange(keyword, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={handleAddRow}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            Add Row
          </button>
        </div>
      )}
      {view == "flashView" && (
        <div className="flex flex-col items-center" {...swipeHandlers}>
        {entries.length > 0 && (
          <div
            className={`w-80 h-48 rounded-lg shadow-lg p-6 text-center flex flex-col justify-center items-center ${TAILWIND_COLORS[currentColorIndex]}`}
          >
              <div className="text-2xl font-bold select-none">{entries[currentIndex][0]}</div>
            <div className="text-lg mt-4 select-none">{entries[currentIndex][1]}</div>
            
          </div>
        )}
        <span className="text-sm mt-2 text-gray-700 select-none">Swipe to change word</span>
      </div> 
      )}
      {!isReadonly && view != "dictionaryView" ? (<div className="flex justify-center mt-4">
        <button onClick={() => setView("dictionaryView") } className="bg-green-500 text-white rounded-full hover:bg-green-600 px-4 py-2">
          {"Table View"}
        </button>
      </div>) : null}
      {view != "flashView" ? (<div className="flex justify-center mt-4">
        <button onClick={() => setView("flashView") } className="bg-orange-500 text-white rounded-full hover:bg-green-600 px-4 py-2">
          {"Flash Cards"}
        </button>
      </div>) : null}
      {view != "matchGameView" ? (<div className="flex justify-center mt-4">
        <button onClick={() => setView("matchGameView") } className="bg-yellow-500 text-white rounded-full hover:bg-green-600 px-4 py-2">
          {"Match Game"}
        </button>
      </div>) : null}
    </div>
  );
};


