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
import { Badge } from "@/components/ui/badge";
import { Module } from "@prisma/client";

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
    // Prepare the update data for onReorder callback
    const bulkUpdatedData = updatedChapters.map((chapter, index) => ({
      id: chapter.id,
      position: items.findIndex((item) => item.id === chapter.id),
    }));

    onReorder(bulkUpdatedData);
  };

  if (!isMounted) {
    return null;
  }

  return (
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
                     "bg-indigo-200 hover:bg-indigo-200",
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
                    onClick={() => onDelete(chapter.id)}
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
  );
};
