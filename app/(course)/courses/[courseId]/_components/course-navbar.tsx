import { NavbarRoutes } from "@/components/navbar-routes";
import { CourseMobileSidebar, CourseSidebarProps as CourseSidebarProps } from "./course-mobile-sidebar";
import { StudentCommunicationLinks } from "./student-communication-links";
import { ContactAuthorButton } from "./contact-author-button";


export const CourseNavbar = ({
    course
}: CourseSidebarProps) => {

    return (
        <div className="p-2 sm:p-4 border-b h-full flex items-center bg-white shadow-sm">
            <CourseMobileSidebar course={course} />
            <div className="flex items-center gap-1 sm:gap-4 ml-auto">
                <StudentCommunicationLinks courseId={course.id.toString()} />
                {course.author && (
                    <ContactAuthorButton
                        courseId={course.id.toString()}
                        authorEmail={course.author.email}
                        authorName={course.author.displayName || `${course.author.firstName || ''} ${course.author.lastName || ''}`.trim() || course.author.email}
                        courseTitle={course.title}
                    />
                )}
                <NavbarRoutes />
            </div>
        </div>
    );

};


