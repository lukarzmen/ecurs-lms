import { cn } from "@/lib/utils";
import { IconType } from "react-icons/lib";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import qs from "query-string";

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
    const isSelected = currentCategoryId === value;

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
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={isSelected}
            className={cn(
                "inline-flex items-center gap-x-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700",
                "transition-colors hover:border-orange-600 hover:bg-orange-100/50 hover:text-orange-800",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isSelected && "border-orange-600 bg-orange-100 text-orange-800"
            )}
        >
            {Icon && <Icon size={20} />}
            <div className="truncate">
                {label}
            </div>
        </button>
    );
}