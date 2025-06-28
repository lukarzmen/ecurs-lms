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
        <div className="flex flex-wrap items-center gap-2 pb-2">            
        {items.map((category) => (
            <CategoryItem key={category.id} label={category.name} icon={iconMap[category.name]} value={category.id}/>
        ))}
        </div>
    );
    }