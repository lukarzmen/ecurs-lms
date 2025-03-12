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
  
  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
  const apiUrl = `${process.env.URL}/api/courses?userId=${userId}&title=${searchParams.title || ''}&categoryId=${searchParams.categoryId || ''}`;
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
