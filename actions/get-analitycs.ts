import { Course, Purchase } from "@prisma/client";
import { number } from "zod";


type PurchaseWithCourse = Purchase & {
    course: Course;
}
//todo to change the type of analytics

const groupByCourse = (purchases: PurchaseWithCourse[]) => {
    const grouped: {[courseTitle: string]: number} = {};

    purchases.forEach(purchase => {
        const courseTitle = purchase.course.title;
        if(grouped[courseTitle]) {
            grouped[courseTitle] += 1;
        } else {
            grouped[courseTitle] = 1;
        }
    });
    return grouped;
}

