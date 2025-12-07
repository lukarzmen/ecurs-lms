import { Categories } from "./_components/categories";
import { SearchInput } from "@/components/ui/search-input";
import { auth } from "@clerk/nextjs/server";
import { MarketplaceCoursesList } from "@/components/ui/marketplace-list";
import { redirect } from "next/navigation";
import { authorizeUser } from '@/hooks/use-auth';
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Search } from "lucide-react";


const SearchPage = async ({ searchParams }: { searchParams: Promise<{ title?: string; categoryId?: string }> }) => {
  const resolvedSearchParams = await searchParams;
  const { title = '', categoryId = '' } = resolvedSearchParams || {};

  const { userId, sessionId } = await auth();
  if (!userId) return redirect('/sign-in');

  const resCategories = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { next: { revalidate: 60 } });
  const categories = await resCategories.json();
  
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/courses/search?title=${encodeURIComponent(title)}&categoryId=${encodeURIComponent(categoryId)}&userId=${userId}`;
  const res = await fetch(apiUrl);
  const courses = await res.json();
  console.log("[SEARCH_PAGE] Courses data:", JSON.stringify(courses.slice(0, 3), null, 2));
  return (
    <>
      <SignedOut>
        <div className="px-6 mt-4 pt-6 mb-0 block w-full">
          Odśwież stronę, aby zalogować się ponownie.
        </div>
      </SignedOut>
      <SignedIn>
        <div className="p-6 space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Search className="h-8 w-8 text-orange-600" />
                <span>Wyszukaj kursy</span>
              </h1>
              <p className="text-gray-600 mt-2">
                Znajdź idealny kurs dla siebie z naszej bogatej oferty edukacyjnej
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="max-w-2xl">
            <SearchInput />
          </div>

          {/* Categories and Results */}
          <div className="space-y-6">
            <Categories items={categories} />
            <MarketplaceCoursesList items={courses} />
          </div>
        </div>
      </SignedIn>
    </>
  );
};
export default SearchPage;
