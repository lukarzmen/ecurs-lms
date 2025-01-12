"use client";

import { useRef, useState } from "react";
import { Button } from "./ui/button";
import AzureBlobService from "@/services/AzureBlobService";
import axios from "axios";
import toast from "react-hot-toast";

interface FileUploadProps {
  onFileChange: (file: File) => void;
}
export const FileUpload = ({ courseId }: { courseId: string }) => {
  const sasToken = process.env.NEXT_PUBLIC_AZURE_SAS_TOKEN;
  const containerName = process.env.NEXT_PUBLIC_AZURE_BLOB_CONTAINER_NAME ?? "default";
  const accountName = process.env.NEXT_PUBLIC_AZURE_BLOB_ACCOUNT_NAME;
  const url = `https://${accountName}.blob.core.windows.net/?${sasToken}&timeout=20`

  const azureBlobService: AzureBlobService = new AzureBlobService(url, containerName);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "initial" | "uploading" | "success" | "fail"
  >("initial");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setStatus("initial");
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    console.log(`uploading file ${file}`);
    if (file) {
      setStatus("uploading");

      try {
        console.log(`uploading file ${file}`);
        const fileName: string = await azureBlobService.uploadFile(
          file,
          `${courseId}-${file.name}`,

        );
        await axios.post(`/api/courses/${courseId}`, { imageUrl: fileName });
        setStatus("success");
        toast.success("Course updated");
      } catch (error) {
        console.error(error);
        setStatus("fail");
        toast.error("Something went wrong");
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="m-2">
      <div className="input-group">
        <label htmlFor="file" className="sr-only">
          Choose a file
        </label>
        <div>
          <div>
            <Button onClick={handleButtonClick} className="upload-button">
              Load File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }} // Hide the file input element
              onChange={handleFileChange}
            />
          </div>
        </div>
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
        <Button onClick={handleUpload} className="submit mt-2 mb-2">
          Upload a file
        </Button>
      )}

      <Result status={status} />
    </div>
  );
};

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
