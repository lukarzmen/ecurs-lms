"use client";
import {
 FcEngineering,
 FcFilmReel,
 FcMultipleDevices,
 FcMusic,
 FcOldTimeCamera,
 FcSalesPerformance,
 FcSportsMode,
 FcGlobe
}from "react-icons/fc";
import { IconType } from "react-icons/lib";
import { CategoryItem } from "./category-item";
import { useI18n } from "@/hooks/use-i18n";

interface Category {
    id: number;
    name: string;
}

interface CategoriesProps {
    items: Category[];
}
const iconMap: Record<Category["name"], IconType> = {
    "Web development": FcEngineering,
    "Data science": FcFilmReel,
    "Italian": FcSportsMode,
    "Engineering": FcEngineering,
    "English": FcSalesPerformance,
    "Technology": FcMultipleDevices,
    "Photography": FcOldTimeCamera,
};

export const Categories = ({ items }: CategoriesProps) => {
    const { t } = useI18n();

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-gray-900">{t("categories.title")}</h2>
                <p className="text-sm text-gray-600">{t("categories.subtitle")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">            
                {items.map((category) => (
                    <CategoryItem key={category.id} label={category.name} icon={iconMap[category.name]} value={category.id}/>
                ))}
            </div>
        </div>
    );
    }