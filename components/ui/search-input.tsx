"use client";

import { Search } from "lucide-react";
import { Input } from "./input";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import qs from "query-string";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const SearchInput = () => {
    const [value, setValue] = useState("");
    const debouncedSearch = useDebounce(value, 500);
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathName = usePathname();

    const currentCategoryId = searchParams.get("categoryId");

    useEffect(() => {
        const url = qs.stringifyUrl(
            {
            url: pathName,
            query: {
                categoryId: currentCategoryId,
                title: debouncedSearch,
            },
            }, {
                skipNull: true,
                skipEmptyString: true,
            }
        );

        if (!debouncedSearch && !currentCategoryId) {
            router.push(pathName);
            return;
        }
        router.push(url);
        
    }, [debouncedSearch, currentCategoryId, router, pathName]);

    return (
       <div className="relative">
        <Search className="h-4 w-4 absolute top-3 left-3 text-gray-400"/>
        <Input value={value} onChange={(e) => {
            setValue(e.target.value);
        }} className="w-full md:w-[400px] pl-9 rounded-full bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-orange-500 transition-colors" placeholder="Wyszukaj kursy..."></Input>
       </div>
    );
}