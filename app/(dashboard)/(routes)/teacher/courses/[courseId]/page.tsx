import { string } from "zod";
import {db} from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {IconBadge} from "@/components/icon-badge";
import { LayoutDashboard } from "lucide-react";
import TitleForm from "./_components/title-form";
import { Description } from "@radix-ui/react-dialog";
import DescriptionForm from "./_components/description-form";
import ImageForm from "./_components/image-form";

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
            id: courseId
        }
    });
    
    // const categories = await db.category.findMany({
    //     orderBy: {
    //         name: "asc"
    //     }
    // });

    console.log(`course: ${course}`);
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
        course.categoryId
    ]

    const totalFields = requiredFields.filter.length
    const completedFields = requiredFields.filter(Boolean).length

    const completionText = `${completedFields}/${totalFields}`

    const courseTitle = course.title;
    return (
        <div className="p-6">
            <div className="flex items-cente justify-between">
                <div className="flex flex-col gap-y-2 ">
                    <h1 className="text-2xl font-medium">
                        Course setup
                    </h1>
                   <span className="text-sm text-slate-800">
                        Complete all fields {completionText}
                   </span>
                </div>    
            </div>
            <div className="grid grid-cols-1 gap-6 mt-16">
                <div className="flex items-center gap-x-2">
                    <IconBadge icon={LayoutDashboard}></IconBadge>
                    <h2 className="text-xl">
                        Customize your course
                    </h2>
                </div>
                <TitleForm title={courseTitle} courseId={courseId} />
                <DescriptionForm description={course.description} courseId={courseId} />
                <ImageForm imageUrl={course.imageUrl} courseId={courseId} />
            </div>
        </div>
    );
}
export default CourseIdPage;