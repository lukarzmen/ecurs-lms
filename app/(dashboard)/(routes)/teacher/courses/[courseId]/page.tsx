import { string } from "zod";
import {db} from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {IconBadge} from "@/components/icon-badge";
import { CircleDollarSign, File, LayoutDashboard, ListCheck } from "lucide-react";
import TitleForm from "./_components/title-form";
import { Description } from "@radix-ui/react-dialog";
import DescriptionForm from "./_components/description-form";
import ImageForm from "./_components/image-form";
import CategoryForm from "./_components/category-form";
import PriceForm from "./_components/price-form";
import AttachmentForm from "./_components/attachment-form";
import ChaptersForm from "./_components/chapters-form";

const CourseIdPage = async ({params}: {
        params: {
            courseId: string
        }
    }
) => {
    const {userId} = auth() ?? "";
    if(!userId){
        return redirect("/");
    }

    const courseId = params.courseId;
    const course = await db.course.findUnique({
        where: {
            id: courseId,
            userId: userId
        },
        include: {
            chapters: {
                orderBy: {
                    position: "asc"
                }
            },
            attachments: {
                orderBy: {
                    createdAt: "desc"
                }
            }
        }
    });
    
    const categories = await db.category.findMany({
        orderBy: {
            name: "asc"
        }
    });

    console.log(`categories: ${categories}`);
    if(!course){
        return (
            <div>
                Course not found
            </div>
        );
    }

    const requiredFields = [
        course.title,
        course.description,
        course.imageUrl,
        course.price,
        course.categoryId,
        course.chapters.some(chapter => chapter.isPublished)
    ]

    const totalFields = requiredFields.filter.length
    const completedFields = requiredFields.filter(Boolean).length

    const completionText = `${completedFields}/${totalFields}`

    const courseTitle = course.title;
    return (
        <div className="p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-y-2 ">
                    <h1 className="text-2xl font-medium">
                        Course setup
                    </h1>
                   <span className="text-sm text-slate-800">
                        Complete all fields {completionText}
                   </span>
                </div>    
            </div>
            <div className="flex items-center gap-x-2 mt-8">
                    <IconBadge icon={LayoutDashboard}></IconBadge>
                    <h2 className="text-xl">
                        Customize your course
                    </h2>
                </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
    
                <TitleForm title={courseTitle} courseId={courseId} />
                <DescriptionForm description={course.description} courseId={courseId} />
                <ImageForm imageUrl={course.imageUrl} courseId={courseId} />
                <CategoryForm categoryId={course.categoryId} options={categories.map(x => {
                    return {
                        label: x.name,
                        value: x.id
                    }
                })} courseId={courseId}></CategoryForm>
                <div className="space-y-6">
                <div>
                    <div className="flex items-center gap-x-2">
                        <IconBadge icon={ListCheck}></IconBadge>
                        <h2 className="text-xl">
                            Course chapters
                        </h2>
                    </div>
                    <div>
                    <ChaptersForm description={course.description} courseId={courseId} />
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-x-2">
                        <IconBadge icon={CircleDollarSign}></IconBadge>
                        <h2 className="text-xl">
                            Sell your course
                        </h2>
                    </div>
                    <PriceForm courseId={courseId} price={course.price}></PriceForm>
                </div>
                <div>
                    <div className="flex items-center gap-x-2">
                        <IconBadge icon={File}></IconBadge>
                        <h2 className="text-xl">
                            Resources & Attachments
                        </h2>
                    </div>
                    <AttachmentForm blobUrl={course.imageUrl} courseId={courseId} />
                </div>
            </div>
            </div>
            
        </div>
    );
}
export default CourseIdPage;