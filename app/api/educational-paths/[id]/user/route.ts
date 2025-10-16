import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const awaitedParams = await params;
    const pathId = Number(awaitedParams.id);
    if (!pathId || isNaN(pathId)) {
      return NextResponse.json({ error: "Invalid pathId" }, { status: 400 });
    }
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId query parameter" }, { status: 400 });
    }
    // Find user by providerId
    const user = await db.user.findUnique({ where: { providerId: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Check if user has access to this educational path
    const userEducationalPath = await db.userEducationalPath.findFirst({
      where: { userId: user.id, educationalPathId: pathId },
    });
    if (!userEducationalPath) {
      return NextResponse.json({ error: "User does not have access to this educational path" }, { status: 403 });
    }
    // Get educational path details and courses
    const path = await db.educationalPath.findUnique({
      where: { id: pathId },
      include: {
        courses: {
          include: {
            course: {
              include: {
                modules: true,
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });
    if (!path) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Pobierz nazwę kategorii
    let categoryName = "";
    if (path.categoryId) {
      const category = await db.category.findUnique({ where: { id: path.categoryId } });
      categoryName = category?.name ?? "";
    }
    // Pobierz nazwę autora
    let authorName = "";
    if (path.authorId) {
      const author = await db.user.findUnique({ where: { id: path.authorId } });
      authorName = author?.displayName || [author?.firstName, author?.lastName].filter(Boolean).join(" ") || "";
    }
    // Flatten courses for frontend
    const courses = path.courses.map(ec => ({
      courseId: ec.courseId,
      title: ec.course.title,
      imageId: ec.course.imageId,
      position: ec.position,
      description: ec.course.description,
      categoryId: ec.course.categoryId,
      authorId: ec.course.authorId,
      modulesCount: ec.course.modules ? ec.course.modules.length : 0,
    }));
    return NextResponse.json({
      id: path.id,
      title: path.title,
      description: path.description,
      imageId: path.imageId ?? "",
      categoryName,
      authorName,
      state: path.state ?? "",
      mode: path.mode ?? "",
      courses,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
  }
}
