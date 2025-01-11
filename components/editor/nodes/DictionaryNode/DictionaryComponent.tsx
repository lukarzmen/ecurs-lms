import React, { useState } from "react";
import { DecoratorNode } from "lexical";
interface DictionaryComponentProps {
  dictionary: Dictionary;
}
export interface Dictionary {
  [Key: string]: string;
}

interface DictionaryComponentProps {
  dictionary: Dictionary;
}

export const DictionaryComponent: React.FC<DictionaryComponentProps> = ({ dictionary }) => {
  const [entries, setEntries] = useState(Object.entries(dictionary));

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

  return (
    <div>
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left" style={{ width: '3rem' }}></th>
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
  );
};

