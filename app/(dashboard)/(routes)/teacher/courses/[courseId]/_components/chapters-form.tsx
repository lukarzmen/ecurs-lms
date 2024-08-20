"use client";

import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    Form,
    FormControl,
    FormDescription,
    FormItem,
    FormField,
    FormLabel,
    FormMessage
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { Pencil, PlusCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Chapter } from "@prisma/client";

const formSchema = z.object({
    title: z.string().min(1, {
        message: "Title is required"
    })
}
);

interface ChaptersFormProps {
    chapters: Chapter[];
    courseId: string;
}
export const ChaptersForm = ({
    chapters,
    courseId
}: ChaptersFormProps) => {
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: ""
        }
    });
    const router = useRouter();
    const { isSubmitting, isValid } = form.formState;
    const toogleUpdating = () => {
        setIsUpdating((current) => !current);
    }
    const toogleCreating = () => {
        setIsCreating((current) => !current);
    }
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await axios.post(`/api/courses/${courseId}/chapters`, values);
            toast.success("Chapter created");
            toogleCreating();
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
        }
    }

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                Course chapters
                <Button onClick={toogleCreating} variant="ghost">
                    {isCreating ? (<>Cancel</>) : (<><PlusCircle className="h-4 w-4 mr-2"></PlusCircle>
                        Add a chapter</>)
                    }


                </Button>
            </div>
            {isCreating ? (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField control={form.control} name="title" render={
                            ({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input disabled={isSubmitting} placeholder="e.g. Introduction to the course" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )
                        }>
                        </FormField>
                        <div className="flex items-center gap-x-2">
                            <Button disabled={!isValid || isSubmitting} type="submit">Create</Button>
                        </div>
                    </form>
                </Form>
            ) : (
                <div>
                    <p className={
                        cn("text-sm mt-2", 
                            !chapters && "text-slate-500 italic"
                        )
                    }>
                        {!chapters ? "No chapters" : chapters.map((chapter) => (
                            <div key={chapter.id} className="flex items-center p-3 w-full bg-sky-100 border-sky-200 border text-sky-700 rounded-md">
                                <p className="text-xs line-clamp-1">{chapter.title}</p>
                                {isUpdating && (
                                    <button type="button" className="ml-auto hover:opacity-75 transition" onClick={() => onDelete(chapter.id)} title="Delete Chapter">
                                        <X className="h-4 w-4">
                                        </X>
                                    </button>
                                )}
                            </div>
                        )
                    )
                        }
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        Drag and drop to reorder chapters
                    </p>
                </div>


            )}
        </div>
    );
}

export default ChaptersForm;
