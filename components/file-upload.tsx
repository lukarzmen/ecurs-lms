"use client";

import { useRef, useState } from "react";
import { Button } from "./ui/button";
import AzureBlobService from "@/services/AzureBlobService";
import axios from "axios";
import toast from "react-hot-toast";


interface FileUploadProps {
    onFileChange: (file: File) => void;
}
export const FileUpload = ({courseId} :
    {courseId: number}
) => {
    const azureBlobService: AzureBlobService = new AzureBlobService();
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<
      'initial' | 'uploading' | 'success' | 'fail'
    >('initial');
  
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        setStatus('initial');
        setFile(e.target.files[0]);
      }
    };

    const handleUpload = async () => {
      if (file) {
        setStatus('uploading');
  
        try {
            const fileName: string = await azureBlobService.uploadFile(file, `${courseId}-${file.name}`);
            await axios.post(`/api/courses/${courseId}`, fileName);
            setStatus('success');
            toast.success("Course updated");
        } catch (error) {
          console.error(error);
          setStatus('fail');
          toast.error("Something went wrong");
        }
      }
    };
  
    return (
        <>
            <div className="input-group">
                <label htmlFor="file" className="sr-only">
                    Choose a file
                </label>
                <input id="file" type="file" onChange={handleFileChange} />
            </div>
            {file && (
                <section>
                    <h2>File details:</h2>
                    <ul>
                        <li>Name: {file.name}</li>
                        <li>Type: {file.type}</li>
                        <li>Size: {file.size} bytes</li>
                    </ul>
                </section>
            )}

            {file && (
                <Button onClick={handleUpload} className="submit">
                    Upload a file
                </Button>
            )}

            <Result status={status} />
        </>
    );
}

const Result = ({ status }: { status: string }) => {
    if (status === "success") {
      return <p>✅ File uploaded successfully!</p>;
    } else if (status === "fail") {
      return <p>❌ File upload failed!</p>;
    } else if (status === "uploading") {
      return <p>⏳ Uploading selected file...</p>;
    } else {
      return null;
    }
};

