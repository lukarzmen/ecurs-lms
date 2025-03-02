import { db } from "@/lib/db";
import { Categories } from "./_components/categories";
import { SearchInput } from "@/components/ui/search-input";
import { getCourses } from "@/actions/get-courses";
import { auth } from "@clerk/nextjs/server";
import { CoursesList } from "@/components/ui/courses-list";

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

  const courses = await getCourses({
    userId: userId || '',
    ...searchParams,
    categoryId: Number(searchParams.categoryId)
  });
  return (
    <>
    <div className="px-6 p-6 pt-6 md:hidden md:mb-0 block">
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
