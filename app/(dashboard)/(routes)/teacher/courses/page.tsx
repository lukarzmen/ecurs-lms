import { Button } from "@/components/ui/button";
import Link from "next/link";

const CoursesPage = () => {
  return (
    <div className="p-6">
      <Link href="/teacher/courses/create">
        <Button>New course</Button>
      </Link>
    </div>
  );
};

export default CoursesPage;
