"use client";

import { Button } from "@/components/ui/button";
import { File, Loader2, Pencil, PlusCircle, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/file-upload";
import toast from "react-hot-toast";

interface AttachmentFormProps {
  courseId: string;
}
export const AttachmentForm = ({ courseId }: AttachmentFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const toogleEdit = () => {
    setIsEditing((current) => !current);
  };
  const [deletingBlobUrl, setdeletingBlobUrl] = useState<string | null>(null);
  const blobUrls = ["test.pdf", "wideo_podsumowanie.mp4", "lekcja.mp3"]; //todo: get from blob storage via courseId

  const onSubmit = async () => {
    // try {
    //     await axios.patch(`/api/courses/${courseId}`, values);
    //     toast.success("Course updated");
    //     toogleEdit();
    //     router.refresh();
    // } catch (error) {
    //     toast.error("Something went wrong");
    // }
  };
  const blobUrlsEmpty = !blobUrls || blobUrls.length === 0;

  const onDelete = async (blobUrl: string) => {
    setdeletingBlobUrl(blobUrl);
    try {
      // await axios.delete(`/api/courses/${courseId}/attachments/${blobUrl}`);
      // toast.success("Attachment deleted");
      router.refresh();
      toast.success("Attachment deleted");
    } catch (error) {
      toast.error("Something went wrong when deleting attachment");
    } finally {
      setdeletingBlobUrl(null);
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Blob
        <Button onClick={toogleEdit} variant="ghost">
          {isEditing && <>Cancel</>}
          {!isEditing && (
            <>
              <PlusCircle className="h-4 w-4 mr-2"></PlusCircle>
              Add file
            </>
          )}
        </Button>
      </div>
      {!isEditing && !blobUrlsEmpty ? (
        blobUrls.map((blobUrl) => (
          <div key={blobUrl} className="flex items-center p-3 w-full bg-sky-100 border-sky-200 border text-sky-700 rounded-md">
            <File className="h-4 w-4 mr-2 flex-shrink-0"></File>
            <p className="text-xs line-clamp-1">{blobUrl}</p>
            {deletingBlobUrl === blobUrl}
            <button
              type="button"
              className="ml-auto hover:opacity-75 transition"
              onClick={() => onDelete(blobUrl)}
              title="Delete Attachment"
            >
              <X className="h-4 w-4"></X>
            </button>
          </div>
        ))
      ) : (
        <></>
      )}
      {isEditing && (
        <div>
          <FileUpload courseId={courseId}></FileUpload>
          {/* <div className="text-xs text-muted-foreground mt-4">
                            16:9 aspect ratio recommended
                        </div> */}
        </div>
      )}
    </div>
  );
};

export default AttachmentForm;
