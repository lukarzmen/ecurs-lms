import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const {id} = await params;
    const pathId = Number(id);
    console.log("PATCH /api/educational-paths/[id]/courses:", { id, pathId, isNaN: isNaN(pathId) });
    if (!pathId || isNaN(pathId)) {
      return NextResponse.json({ error: "Invalid pathId" }, { status: 400 });
    }
    console.log("Request headers:", req.headers);
    const body = await req.json();
    console.log("Request body:", body, "Body type:", typeof body, "Keys:", Object.keys(body || {}));
    
    // If body is empty or doesn't have any action, return error
    if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
      console.error("Empty body received, expected remove, add, or order");
      return NextResponse.json({ error: "Request body cannot be empty" }, { status: 400 });
    }
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
