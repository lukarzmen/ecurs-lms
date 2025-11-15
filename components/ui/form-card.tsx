"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface StatusInfo {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  icon?: LucideIcon;
}

interface FormCardProps {
  title: string;
  icon?: LucideIcon;
  status?: StatusInfo;
  isLoading?: boolean;
  loadingMessage?: string;
  children: React.ReactNode;
  className?: string;
}

const FormCard = React.forwardRef<HTMLDivElement, FormCardProps>(
  ({ 
    title, 
    icon: Icon, 
    status, 
    isLoading = false, 
    loadingMessage = "Ładowanie...", 
    children, 
    className,
    ...props 
  }, ref) => {
    if (isLoading) {
      return (
        <Card ref={ref} className={cn("", className)} {...props}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5" />}
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{loadingMessage}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5" />}
              {title}
            </div>
            {status && (
              <Badge 
                variant={status.variant} 
                className={cn(
                  status.variant === "secondary" && "bg-blue-500 text-white",
                  status.variant === "default" && "bg-green-500",
                  status.className
                )}
              >
                {status.icon && <status.icon className="h-3 w-3 mr-1" />}
                {status.label}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      </Card>
    );
  }
);

FormCard.displayName = "FormCard";

// Form section components for consistent styling
interface FormSectionProps {
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  className?: string;
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ children, variant = "info", className }, ref) => {
    const variantClasses = {
      info: "bg-blue-50 border-blue-200 text-blue-800",
      success: "bg-green-50 border-green-200 text-green-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      error: "bg-red-50 border-red-200 text-red-800",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "p-3 border rounded-md text-sm",
          variantClasses[variant],
          className
        )}
      >
        {children}
      </div>
    );
  }
);

FormSection.displayName = "FormSection";

// Form actions container for consistent button layouts
interface FormActionsProps {
  children: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const FormActions = React.forwardRef<HTMLDivElement, FormActionsProps>(
  ({ children, orientation = "horizontal", className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex gap-2",
          orientation === "vertical" ? "flex-col" : "flex-row",
          className
        )}
      >
        {children}
      </div>
    );
  }
);

FormActions.displayName = "FormActions";

// Form grid for input layouts
interface FormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const FormGrid = React.forwardRef<HTMLDivElement, FormGridProps>(
  ({ children, columns = 2, className }, ref) => {
    const gridClasses = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
    };

    return (
      <div
        ref={ref}
        className={cn("grid gap-2", gridClasses[columns], className)}
      >
        {children}
      </div>
    );
  }
);

FormGrid.displayName = "FormGrid";

// Form footer for additional info or help text
interface FormFooterProps {
  children: React.ReactNode;
  className?: string;
}

const FormFooter = React.forwardRef<HTMLDivElement, FormFooterProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-xs text-muted-foreground text-center", className)}
      >
        {children}
      </div>
    );
  }
);

FormFooter.displayName = "FormFooter";

export { 
  FormCard, 
  FormSection, 
  FormActions, 
  FormGrid, 
  FormFooter,
  type StatusInfo,
  type FormCardProps 
};