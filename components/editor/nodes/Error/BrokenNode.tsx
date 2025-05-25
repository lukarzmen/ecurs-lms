
import React from "react";
import { NodeErrorBoundary } from "./NodeErrorBoundary";

export function withNodeErrorBoundary(children: React.ReactNode) {
  return <NodeErrorBoundary>{children}</NodeErrorBoundary>;
}
export default function BrokenNode() {
  return (
    <div className="bg-red-100 text-red-700 p-2 rounded border border-red-300">
      Ten element jest uszkodzony i nie może zostać wyświetlony.
    </div>
  );
}