"use client";

import axios from "axios";
import {zodResolver} from "@hookform/resolvers/zod";
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
import {Pencil} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const formSchema = z.object({
    title: z.string().min(1)
    }
);

interface ChapterTitleFormProps {
    title: string;
    courseId: string;
    chapterId: string;
}
export const ChapterTitleForm = ({
    title,
    courseId,
    chapterId,
}: ChapterTitleFormProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: title
        }
    });
    const router = useRouter();
    const {isSubmitting, isValid} = form.formState;
    const toogleEdit = () => {
        setIsEditing((current) => !current);
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, values);
            toast.success("Chapter updated");
            toogleEdit();
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
        }
    }

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                Chapter title
                <Button onClick={toogleEdit} variant="ghost">
                    {isEditing ? (<>Cancel</>) : (<><Pencil className="h-4 w-4 mr-2"></Pencil>
                        Edit title</>)
                        }
                    
                    
                </Button>
            </div>
            {isEditing ? (
                <Form {...form}> 
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField control={form.control} name="title" render={
                            ({field}) => (
                                <FormItem>                                   
                                    <FormControl>
                                        <Input disabled={isSubmitting} placeholder="e.g. 'Introduction" {...field}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )
                        }>                               
                        </FormField>
                        <div className="flex items-center gap-x-2">
                            <Button disabled={!isValid || isSubmitting} type="submit">Save</Button>
                        </div>
                    </form>
                </Form>
                    ) : (
                        <p className="text-sm mt-2">
                            {title}
                        </p>
                    )}
        </div>
    ); }

export default ChapterTitleForm;
