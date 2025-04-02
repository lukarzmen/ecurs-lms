import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from "lexical";
import { useEffect, useState } from "react";
import { DescriptionNode } from "../../nodes/DictionaryNode/DescriptionNode";
import toast from "react-hot-toast";
import OpenAIService from "@/services/OpenAIService";
import { set } from "zod";

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
  const [isLoading, setIsLoading] = useState(false);
  const [definition, setDefinition] = useState("");
  const handleSubmit = () => {
    if (definition.trim()) {
      onSubmit(definition.trim());
      setDefinition("");
      onClose();
    } else {
      toast.error("Definicja nie może być pusta.");
    }
  };
  const handleClose = () => {
    setDefinition("");
    onClose();
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
        <h2 className="text-xl font-bold mb-4">Napisz coś o {selectedText}</h2>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          rows={4}
          placeholder="Tu wprowadź definicję..."
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
            onClick={handleClose}
          >
            Anuluj
          </button>
            {isLoading ? (
            <div className="px-4 py-2 bg-blue-300 text-white rounded-md">
              Ładowanie...
            </div>
            ) : (
            <button
              className="px-4 py-2 bg-blue-300 text-white rounded-md"
              onClick={() => {
              setIsLoading(true);
              fetch('/api/tasks', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({ systemPrompt: "Jesteś ekspertem w danej dziedzinie. Wyjaśnij znaczenie w 3 zdaniach.",
                userPrompt: `Napisz definicję dla słowa "${selectedText}".`,
                }),
              })
              .then((response) => response.text())
              .then((data) => {
                setDefinition(data);
                toast.success("Definicja została wygenerowana przez AI.");
              })
              .catch(() => {
                toast.error("Błąd podczas generowania definicji.");
              })
              .finally(() => {
                setIsLoading(false);
              });
              }}
            >
              Generuj AI
            </button>
            )}
          <button
            className="px-4 py-2 bg-orange-500 text-white rounded-md"
            onClick={handleSubmit}
          >
            Zatwierdź
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
        console.debug("Inserting definition node");
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const textContent = selection.getTextContent().trim();
            if (!textContent) {
                toast.error("Zaznacz tekst, aby dodać definicję.");
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
