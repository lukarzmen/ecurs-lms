import React, { useState } from "react";
import { random } from "lodash";

interface DictionaryComponentProps {
  dictionary: Dictionary;
  isReadonly?: boolean;
}

export interface Dictionary {
  [Key: string]: string;
}

export const DictionaryComponent: React.FC<DictionaryComponentProps> = ({ dictionary, isReadonly }) => {
  const [entries, setEntries] = useState(Object.entries(dictionary));
  const [isFlashcardView, setIsFlashcardView] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);

  const TAILWIND_COLORS = [
    "bg-red-500",
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
  };

  const handleAddRow = () => {
    setEntries((prevEntries) => [...prevEntries, ["", ""]]);
  };

  const handleRemoveRow = (index: number) => {
    setEntries((prevEntries) => prevEntries.filter((_, i) => i !== index));
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

  return (
    <div>
      {!isReadonly ? (<button
        onClick={() => setIsFlashcardView(!isFlashcardView)}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        {isFlashcardView ? "To Table View" : "To Flashcard View"}
      </button>) : null}

      {isFlashcardView || isReadonly ? (
        <div className="flex flex-col items-center">
          {entries.length > 0 && (
            <div
              className={`w-80 h-48 rounded-lg shadow-lg p-6 text-center flex flex-col justify-center items-center ${TAILWIND_COLORS[currentColorIndex]}`}
            >
              <div className="text-2xl font-bold">{entries[currentIndex][0]}</div>
              <div className="text-lg mt-4">{entries[currentIndex][1]}</div>
            </div>
          )}
          <div className="mt-4 flex justify-between w-80">
            <button
              onClick={handlePrevious}
              className="px-4 py-2 w-32 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 w-32 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
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
                        const newKeyword = e.target.value;
                        setEntries((prevEntries) =>
                          prevEntries.map((entry, i) =>
                            i === index ? [newKeyword, entry[1]] : entry
                          )
                        );
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
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Row
          </button>
        </div>
      )}
    </div>
  );
};
