import { MarketplaceCourseCard } from "./course-card";

export interface MarketplaceCourse {
    trialPeriodDays?: number | null;
    id: number;
    title: string;
    imageId?: string;
    modulesCount: number;
    nonFinishedModuleId: number;
    enrolled: boolean;
    author?: {
        displayName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
    } | null;
    category?: { name: string } | null;
    price?: number | null;
    currency?: string | null;
    isRecurring?: boolean;
    interval?: string | null;
}

export interface MarketplaceCoursesListBaseProps {
    items: MarketplaceCourse[];
}

export const MarketplaceCoursesList = ({ items }: MarketplaceCoursesListBaseProps) => {
    if (!items || items.length === 0) {
        return (
            <div className="flex justify-center items-center w-full h-full">
                <div className="text-center text-sm text-muted-foreground mt-10">Nie znaleziono kursów</div>
            </div>
        );
    }
    return (
        <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mt-12">
            {items.map(item => {
                const commonProps = {
                    author: item.author?.displayName || `${item.author?.firstName || ''} ${item.author?.lastName || ''}`.trim() || 'Nieznany autor',
                    id: item.id,
                    title: item.title,
                    imageId: item.imageId ?? "",
                    chaptersLength: item.modulesCount,
                    category: item.category?.name!,
                    nonFinishedModuleId: item.nonFinishedModuleId,
                    price: item.price !== undefined && item.price !== null ? Number(item.price) : 0,
                    currency: item.currency,
                    isRecurring: item.isRecurring,
                    interval: item.interval,
                    trialPeriodDays: item.trialPeriodDays ?? null,
                };
                if (item.enrolled) {
                    return (
                        <div key={item.id} className="opacity-60 pointer-events-none select-none">
                            <MarketplaceCourseCard
                                {...commonProps}
                                key={item.id}
                            />
                        </div>
                    );
                } else {
                    return (
                        <MarketplaceCourseCard
                            {...commonProps}
                            key={item.id}
                        />
                    );
                }
            })}
        </div>
    );
};

