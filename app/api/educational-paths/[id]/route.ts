import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pathId = Number(id);
    if (!pathId || isNaN(pathId)) {
      return NextResponse.json({ error: "Invalid pathId" }, { status: 400 });
    }
      const path = await db.educationalPath.findUnique({
        where: { id: pathId },
        include: {
          courses: {
            include: {
              course: true,
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
        position: ec.position,
      }));
      const educationalPathPrice = await db.educationalPathPrice.findUnique({
        where: { educationalPathId: pathId },
      });
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
        price: educationalPathPrice
      });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
  }
}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id} = await params;
    const pathId = Number(id);
    if (!pathId || isNaN(pathId)) {
      return NextResponse.json({ error: "Invalid pathId" }, { status: 400 });
    }
    const body = await req.json();
    const updateData: any = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.imageId !== undefined) updateData.imageId = body.imageId;
  if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    const updated = await db.educationalPath.update({
      where: { id: pathId },
      data: updateData,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await db.educationalPath.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete educational path failed" }, { status: 500 });
  }
}
