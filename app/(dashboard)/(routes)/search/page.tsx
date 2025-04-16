import { db } from "@/lib/db";
import { Categories } from "./_components/categories";
import { SearchInput } from "@/components/ui/search-input";
import { auth } from "@clerk/nextjs/server";
import { CoursesList } from "@/components/ui/courses-list";
import { env } from "process";

interface SearchPageProps {
  searchParams: {
    title: string;
    categoryId: string;
  }
}
const SearchPage = async ({
  searchParams
}: SearchPageProps) => {
  const { userId } = auth() || { userId: '' };
  
  const resCategories = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { next: { revalidate: 60 } });
  const categories = await resCategories.json();
  
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/courses/search?title=${searchParams.title || ''}&categoryId=${searchParams.categoryId || ''}`;
  const res = await fetch(apiUrl);
  const courses = await res.json();

  return (
    <>
    <div className="px-6 mt-4 pt-6 mb-0 block w-full">
      <SearchInput />
    </div>
      <div className="p-6 space-y-4">
        <Categories items={categories} />
        <CoursesList items={courses} />
      </div>
    </>
  );
};
export default SearchPage;
