import React from "react";
import BrokenNode from "./BrokenNode";

export class NodeErrorBoundary extends React.Component<{children: React.ReactNode}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    // Optionally log error
  }

  render() {
    if (this.state.hasError) {
      return <BrokenNode />;
    }
    return this.props.children;
  }
}