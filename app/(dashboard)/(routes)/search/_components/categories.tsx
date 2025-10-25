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

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-gray-900">Kategorie</h2>
                <p className="text-sm text-gray-600">Przeglądaj kursy według kategorii</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">            
                {items.map((category) => (
                    <CategoryItem key={category.id} label={category.name} icon={iconMap[category.name]} value={category.id}/>
                ))}
            </div>
        </div>
    );
    }