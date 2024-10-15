"use client";

import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { set } from "zod";

interface ActionsProps {
    disabled: boolean;
    courseId: string;
    isPublished: boolean;
}
export const Actions = ({
disabled,
courseId,
isPublished
}: ActionsProps) => {

    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const onDelete = async () => {
    try {
        setIsLoading(true);
        if(isPublished){
            await axios.patch(`/api/courses/${courseId}/unpublish`); 
            toast.success("Chapter pusblished");  
        }else{
            await axios.patch(`/api/courses/${courseId}/publish`);  
            toast.success("Chapter unpublished");
        }
        await axios.patch(`/api/courses/${courseId}/unpublish`);  
     
        router.refresh();
    } catch (error) {
        toast.error("Failed to delete chapter");
    }
    finally {
        setIsLoading(false);
    }
}

    return (
        <div className="flex items-center gap-x-2">
            <Button onClick={() => {}} disabled={disabled || isLoading} variant="outline" size="sm">
                {isPublished ? "Unpublish" : "Publish"}
            
            </Button>
            <ConfirmModal onConfirm={onDelete}>
                <Button size="sm" disabled={isLoading} >
                    <Trash className="h-4 w-4" />
                </Button>
            </ConfirmModal>
        </div>
    );  

};