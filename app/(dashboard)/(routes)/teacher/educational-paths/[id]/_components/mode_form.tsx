"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Settings } from "lucide-react";
import { FormCard, FormActions } from "@/components/ui/form-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/use-i18n";


export default function EduPathModeForm({ educationalPathId: id, mode }: { educationalPathId: string, mode: number }) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);
  const [formMode, setFormMode] = useState(mode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleEdit = () => {
    setIsEditing((v) => !v);
    setFormMode(currentMode); // Reset form value on cancel
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormMode(parseInt(e.target.value, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/educational-paths/${id}/mode`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: formMode }),
      });
      if (!res.ok) throw new Error();
      setCurrentMode(formMode);
      toast.success(t("epMode.updated"));
      setIsEditing(false);
    } catch {
      toast.error(t("epMode.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6">
      <FormCard
        title={t("epMode.title")}
        icon={Settings}
        status={{
          label: currentMode === 0 ? t("epMode.private") : t("epMode.public"),
          variant: currentMode === 1 ? "default" : "outline",
          className: currentMode === 1 ? "bg-blue-500" : ""
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{t("epMode.hint")}</span>
          <Button onClick={toggleEdit} variant="ghost" size="sm">
            {isEditing ? (
              t("epMode.cancel")
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                {t("epMode.edit")}
              </>
            )}
          </Button>
        </div>
      {isEditing ? (
        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div className="form-group">
            <Select value={formMode.toString()} onValueChange={(value) => setFormMode(parseInt(value, 10))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("epMode.privateOption")}</SelectItem>
                <SelectItem value="1">{t("epMode.publicOption")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FormActions>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("epMode.saving") : t("epMode.save")}
            </Button>
          </FormActions>
        </form>
      ) : (
        <div className="p-3 bg-muted/50 rounded-md border">
          <span className="font-medium">
            {currentMode === 0 ? t("epMode.private") : t("epMode.public")}
          </span>
          <span className="text-sm text-muted-foreground ml-2">
            – {currentMode === 0
              ? t("epMode.privateDesc")
              : t("epMode.publicDesc")}
          </span>
        </div>
      )}
      </FormCard>
    </div>
  );
}