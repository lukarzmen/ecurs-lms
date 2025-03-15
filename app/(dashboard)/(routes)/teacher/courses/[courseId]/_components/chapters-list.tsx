"use client";

import { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Grip, Pencil, Trash2 } from "lucide-react";
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
  const [chapters, setChapters] = useState(items);
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
    <div>
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
                        "flex items-center gap-x-2 bg-indigo-200 border text-indigo-700 rounded-md mb-3 text-sm",
                        "border-indigo-100"
                      )}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <div
                        className={cn(
                          "px-2 py-3 border-r border-r-indigo-200 hover:bg-indigo-300 rounded-l-md transition",
                          "bg-indigo-200 hover:bg-indigo-200"
                        )}
                        {...provided.dragHandleProps}
                      >
                        <Grip className="h-5 w-5" />
                      </div>
                      <div>{chapter.title}</div>
                      <div className="ml-auto pr-2 flex items-center gap-x-2">
                        <Pencil
                          onClick={() => onEdit(chapter.id)}
                          className="cursor-pointer hover:opacity-75 h-4 w-4 transition"
                        />
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
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeletion}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
