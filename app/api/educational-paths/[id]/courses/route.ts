import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const {id} = await params;
    const pathId = Number(id);
    if (!pathId || isNaN(pathId)) {
      return NextResponse.json({ error: "Invalid pathId" }, { status: 400 });
    }
    const body = await req.json();
    // Remove course
    if (body.remove) {
      await db.educationalPathCourse.delete({
        where: {
          educationalPathId_courseId: {
            educationalPathId: pathId,
            courseId: body.remove,
          },
        },
      });
      return NextResponse.json({ success: true });
    }
    // Add course
    if (body.add) {
      // Find max position
      const maxPos = await db.educationalPathCourse.aggregate({
        where: { educationalPathId: pathId },
        _max: { position: true },
      });
      await db.educationalPathCourse.create({
        data: {
          educationalPathId: pathId,
          courseId: body.add,
          position: (maxPos._max.position ?? 0) + 1,
        },
      });
      return NextResponse.json({ success: true });
    }
    // Reorder courses
    if (body.order && Array.isArray(body.order)) {
      for (let i = 0; i < body.order.length; i++) {
        try {
          await db.educationalPathCourse.update({
            where: {
              educationalPathId_courseId: {
                educationalPathId: pathId,
                courseId: body.order[i],
              },
            },
            data: { position: i + 1 },
          });
        } catch (err) {
          // If not found, skip
          continue;
        }
      }
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to modify courses" }, { status: 500 });
  }
}
