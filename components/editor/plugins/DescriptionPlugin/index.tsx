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
import { Loader2, X, BookOpen, Sparkles } from "lucide-react";

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
  
  const handleGenerateAI = () => {
    setIsLoading(true);
    fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt: "Jesteś ekspertem w danej dziedzinie. Wyjaśnij znaczenie w 2-3 zdaniach. Bądź zwięzły i precyzyjny.",
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
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl max-w-lg w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Nowa definicja</h3>
              <h2 className="text-lg font-bold text-foreground">{selectedText}</h2>
            </div>
          </div>
          <button
            className="p-1 hover:bg-white rounded-lg transition-colors duration-200 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
            title="Zamknij"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <label className="block text-sm font-semibold text-foreground mb-2">
            Definicja
          </label>
          <textarea
            className="w-full p-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-primary bg-background font-medium text-foreground resize-none transition-all duration-200"
            rows={5}
            placeholder="Wpisz definicję lub wygeneruj przy pomocy AI..."
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {definition.length} / 500 znaków
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/50 px-6 py-3 flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-all duration-200 font-semibold active:scale-95"
            onClick={handleClose}
            disabled={isLoading}
          >
            Anuluj
          </button>
          <button
            className="px-4 py-2 bg-card border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-semibold flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGenerateAI}
            disabled={isLoading}
            title="Wygeneruj definicję przy pomocy AI"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generuję...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generuj AI
              </>
            )}
          </button>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-semibold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!definition.trim() || isLoading}
            title="Zatwierdź definicję"
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
            setIsModalOpen(true);
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
