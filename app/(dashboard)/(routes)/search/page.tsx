import { Categories } from "./_components/categories";
import { SearchInput } from "@/components/ui/search-input";
import { auth } from "@clerk/nextjs/server";
import { MarketplaceCoursesList } from "@/components/ui/marketplace-list";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMessages, getRequestLocale, createTranslator } from "@/lib/i18n/server";


const SearchPage = async ({ searchParams }: { searchParams: Promise<{ title?: string; categoryId?: string }> }) => {
  const resolvedSearchParams = await searchParams;
  const { title = '', categoryId = '' } = resolvedSearchParams || {};

  const locale = await getRequestLocale();
  const messages = await getMessages(locale, "common");
  const t = createTranslator(messages);

  const { userId, sessionId } = await auth();
  if (!userId) {
    return (
      <SignedOut>
        <div className="p-6">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              <Search className="h-8 w-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">{t("search.title")}</h1>
            </div>
            <p className="text-gray-600">
              {t("search.signedOutDesc")}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/sign-in">{t("search.signIn")}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/sign-up">{t("search.signUp")}</Link>
              </Button>
            </div>

            <p className="text-sm text-gray-600">
              {t("search.signedOutHint")}
            </p>
          </div>
        </div>
      </SignedOut>
    );
  }

  const resCategories = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { next: { revalidate: 60 } });
  const categories = await resCategories.json();
  
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/courses/search?title=${encodeURIComponent(title)}&categoryId=${encodeURIComponent(categoryId)}&userId=${userId}`;
  const res = await fetch(apiUrl, { next: { revalidate: 60, tags: ["learning-units-search"] } });
  const courses = await res.json();
  return (
    <>
      <SignedIn>
        <div className="p-6 space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Search className="h-8 w-8 text-orange-600" />
                <span>{t("search.discover")}</span>
              </h1>
              <p className="text-gray-600 mt-2">
                {t("search.discoverDesc")}
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
