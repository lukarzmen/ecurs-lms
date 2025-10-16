import { IconBadge } from "@/components/icon-badge";
import { ChevronRight, LucideIcon } from "lucide-react";

interface InfoCardProps {
    numberOfItems: number;
    variant?: "default" | "success" | "course" | "path";
    label: string;
    icon: LucideIcon;
}

export const InfoCard = ({numberOfItems, variant, label, icon }: InfoCardProps) => {
    let cardStyle = "border rounded-md flex items-center gap-x-2 p-3 ";
    let labelColor = "";
    let countColor = "text-gray-500";
    if (variant === "course") {
        cardStyle += "border-blue-300 bg-blue-50";
        labelColor = "text-blue-700";
        countColor = "text-blue-500";
    } else if (variant === "path") {
        cardStyle += "border-orange-300 bg-orange-50";
        labelColor = "text-orange-700";
        countColor = "text-orange-500";
    } else if (variant === "success") {
        cardStyle += "border-green-300 bg-green-50";
        labelColor = "text-green-700";
        countColor = "text-green-500";
    } else {
        cardStyle += "border-gray-300 bg-white";
        labelColor = "text-gray-700";
        countColor = "text-gray-500";
    }
    // Only pass allowed variants to IconBadge
    const iconVariant = ["default", "success", "course", "path"].includes(variant || "") ? variant : "default";
    return (
        <div className={cardStyle}>
            <IconBadge variant={iconVariant as any} icon={icon} />
            <div className="font-medium">
                <p className={labelColor}>{label}</p>
                <p className={`text-sm ${countColor}`}>
                    {numberOfItems} {numberOfItems === 1 ? "sztuka" : (numberOfItems >= 2 && numberOfItems <= 4 ? "sztuki" : "sztuk")}
                </p>
            </div>
        </div>
    );
}