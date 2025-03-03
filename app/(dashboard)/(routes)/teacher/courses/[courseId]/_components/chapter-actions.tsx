"use client";

import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { set } from "zod";

interface ChapterActionsProps {
    disabled: boolean;
    courseId: string;
    chapterId: string;
}
export const ChapterActions = ({
courseId,
chapterId,
}: ChapterActionsProps) => {

    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const onDelete = async () => {
    try {
        setIsLoading(true);
        await axios.delete(`/api/courses/${courseId}/chapters/${chapterId}`);  
        toast.success("Chapter deleted"); 
        router.refresh();
        router.push(`/teacher/courses/${courseId}`);
    } catch (error) {
        toast.error("Failed to delete chapter");
    }
    finally {
        setIsLoading(false);
    }
}

    return (
        <div className="flex items-center gap-x-2">
            <ConfirmModal onConfirm={onDelete}>
                <Button size="sm" disabled={isLoading} >
                    <Trash className="h-4 w-4" />
                </Button>
            </ConfirmModal>
        </div>
    );  

};