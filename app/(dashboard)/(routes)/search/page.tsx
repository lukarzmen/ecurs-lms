import { Categories } from "./_components/categories";
import { SearchInput } from "@/components/ui/search-input";
import { auth } from "@clerk/nextjs/server";
import { MarketplaceCoursesList } from "@/components/ui/marketplace-list";
import { redirect } from "next/navigation";
import { authorizeUser } from '@/hooks/use-auth';
import { SignedIn, SignedOut } from "@clerk/nextjs";


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

  return (
    <>
      <SignedOut>
        <div className="px-6 mt-4 pt-6 mb-0 block w-full">
          Odśwież stronę, aby zalogować się ponownie.
        </div>
      </SignedOut>
      <SignedIn>
        <div className="px-6 mt-4 pt-6 mb-0 block w-full">
          <SearchInput />
        </div>
        <div className="p-6 space-y-4">
          <Categories items={categories} />
          <MarketplaceCoursesList items={courses} />
        </div>
      </SignedIn>
    </>
  );
};
export default SearchPage;
