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
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Combobox from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  categoryId: z.string().min(1),
});

interface CategoryFormProps {
  categoryId: string;
  courseId: string;
  options: {
    label: string;
    value: string;
  }[];
}

export const CategoryForm = ({
  categoryId,
  courseId,
  options,
}: CategoryFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: categoryId,
    },
  });
  const router = useRouter();
  const { isSubmitting, isValid } = form.formState;
  const toogleEdit = () => {
    setIsEditing((current) => !current);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("Course updated");
      toogleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };
  const selectedOption = options.find(
    (option) => option.value === categoryId,
  )?.label;

  return (
    <div className="mt-6 border bg-indigo-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Course category
        <Button onClick={toogleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2"></Pencil>
              Edit
            </>
          )}
        </Button>
      </div>
      {isEditing ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Combobox options={options} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                Save
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <p
          className={cn("text-sm mt-2", !categoryId && "text-slate-500 italic")}
        >
          {selectedOption || "No category selected"}
        </p>
      )}
    </div>
  );
};

export default CategoryForm;
