import { IconBadge } from "@/components/icon-badge";
import { ChevronRight, LucideIcon } from "lucide-react";

interface InfoCardProps {
    numberOfItems: number;
    variant?: "default" | "success";
    label: string;
    icon: LucideIcon;
}

export const InfoCard = ({numberOfItems, variant, label, icon }: InfoCardProps) => {
    return (
        <div className="border rounded-md flex items-center gap-x-2 p-3">
            <IconBadge variant={variant} icon={icon}>

            </IconBadge>
            <div className="font-medium">
                <p>{label}</p>
                <p className="text-gray-500 text-sm">
                    {numberOfItems} {numberOfItems === 1 ? "kurs" : (numberOfItems >= 2 && numberOfItems <= 4 ? "kursy" : "kursów")}
                </p>
            </div>

        </div>
    );
}