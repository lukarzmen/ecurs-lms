"use client";

import { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Grip, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Module } from "@prisma/client";
import { Button } from "@/components/ui/button";

interface ChaptersListProps {
  items: Module[];
  onReorder: (updateData: { id: number; position: number }[]) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const ChaptersList = ({
  items,
  onReorder,
  onEdit,
  onDelete,
}: ChaptersListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [chapters, setChapters] = useState<Module[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(
    null
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      setChapters(items);
    }
  }, [items, isMounted]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(chapters);
    const [reorderedChapters] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedChapters);

    setChapters(items);

    const startIndex = Math.min(result.source.index, result.destination.index);
    const endIndex = Math.max(result.source.index, result.destination.index);

    const updatedChapters = items.slice(startIndex, endIndex + 1);
    const bulkUpdatedData = updatedChapters.map((chapter, index) => ({
      id: chapter.id,
      position: items.findIndex((item) => item.id === chapter.id),
    }));

    onReorder(bulkUpdatedData);
  };

  const handleDeleteConfirm = (id: number) => {
    setIsModalOpen(true);
    setSelectedChapterId(id);
  };

  const confirmDeletion = () => {
    if (selectedChapterId !== null) {
      onDelete(selectedChapterId);
      setIsModalOpen(false);
      setSelectedChapterId(null);
    }
  };

  const cancelDeletion = () => {
    setIsModalOpen(false);
    setSelectedChapterId(null);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <section className="w-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="chapters">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {chapters.map((chapter, index) => (
                <Draggable
                  key={chapter.id}
                  draggableId={chapter.id.toString()}
                  index={index}
                >
                  {(provided) => (
                    <div
                      className={cn(
                        "group flex items-center gap-x-2 bg-orange-200 border text-orange-700 rounded-md hover:bg-orange-300 mb-3 text-sm", // Added 'group' and kept 'hover:bg-orange-300'
                        "border-orange-100"
                      )}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <div
                        className={cn(
                          "px-2 py-3 border-r border-r-orange-200 group-hover:bg-orange-300 rounded-l-md transition", // Changed hover: to group-hover:
                          "bg-orange-200 " // Kept original background
                        )}
                        {...provided.dragHandleProps}
                      >
                        <Grip className="h-5 w-5" />
                      </div>
                      <div 
                        className="flex-grow px-2 py-3 cursor-pointer hover:bg-orange-300 transition" // This hover is fine as it matches the parent's hover
                        onClick={() => onEdit(chapter.id)}
                      >
                        {chapter.title}
                      </div>
                      <div className="ml-auto pr-2 flex items-center gap-x-2">
                        <Trash2
                          onClick={() => handleDeleteConfirm(chapter.id)}
                          className="cursor-pointer hover:opacity-75 h-4 w-4 transition"
                        />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <div>Are you sure you want to delete this chapter?</div>
            <div className="flex justify-end mt-4">
              <Button
                variant="secondary"
                className="mr-2"
                onClick={cancelDeletion}
              >
                Anuluj
              </Button>
              <Button variant="destructive" onClick={confirmDeletion}>
                Usuń
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
