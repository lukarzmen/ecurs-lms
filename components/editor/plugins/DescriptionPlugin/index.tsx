import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from "lexical";
import { useEffect, useState } from "react";
import { DescriptionNode } from "../../nodes/DictionaryNode/DescriptionNode";

export const INSERT_DEFINITION_NODE_COMMAND = createCommand("INSERT_DEFINITION_NODE_COMMAND");

function DefinitionModal({
  isOpen,
  onClose,
  onSubmit,
  selectedText,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (definition: string) => void;
  selectedText: string;
}) {
  const [definition, setDefinition] = useState("");

  const handleSubmit = () => {
    if (definition.trim()) {
      onSubmit(definition.trim());
      onClose();
    } else {
      console.warn("Definition cannot be empty.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">Define "{selectedText}"</h2>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          rows={4}
          placeholder="Enter the definition..."
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={handleSubmit}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DescriptionPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    return editor.registerCommand(
      INSERT_DEFINITION_NODE_COMMAND,
      () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const textContent = selection.getTextContent().trim();
            if (!textContent) {
              alert("To add definition to selected text please select text first.");
              return false;
            }

            setSelectedText(textContent);
            setIsModalOpen(true); // Open the modal
          }     
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  const handleModalSubmit = (definition: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const definitionNode = new DescriptionNode(selectedText, definition);
        selection.insertNodes([definitionNode]);
      }
    });
  };

  return (
    <>
      <DefinitionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        selectedText={selectedText}
      />
    </>
  );
}
