import { cn } from "@/lib/utils";
import { Icon } from "lucide-react";
import { IconType } from "react-icons/lib";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import qs from "query-string";
import { url } from "inspector";

interface CategoryItemProps {
    label: string;
    value?: number;
    icon?: IconType;
}

export const CategoryItem = ({ label, icon: Icon, value }: CategoryItemProps) => {
    const pathName = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : null;
    const currentTitle = searchParams.get("title");
    const onClick = () => {
        const url = qs.stringifyUrl({
            url: pathName,
            query: {
                categoryId: isSelected ? null : value,
                title: currentTitle,
            }},{
                skipNull: true,
                skipEmptyString: true,
            }
        );
        router.push(url);
    };
    const isSelected = currentCategoryId === value;
    return (
        <button className={cn("py-2 px-3 text-sm border-slate-200 rounded-full flex items-center gap-x-2 hover:border-sky-700 transition",
           isSelected && "border-sky-700 bg-sky-200/20 text-sky-800"
        )} type="button" onClick={onClick}>
            {Icon && <Icon size={20} />}
            <div className="truncate">
                {label}
            </div>
        </button>
    );
}