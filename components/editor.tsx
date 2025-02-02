"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const BasicEditor = ({ value, onChange }: EditorProps) => {
  const ReactQuill = useMemo(
    () =>
      dynamic(() => import("react-quill"), {
        ssr: false,
      }),
    [],
  );

  return (
    <div className="bg-white">
      <ReactQuill value={value} onChange={onChange} />
    </div>
  );
};
// 