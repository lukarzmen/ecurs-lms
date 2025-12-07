import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Get first category
    const firstCat = await db.category.findFirst();
    
    if (!firstCat) {
      return NextResponse.json({ error: "No categories found" }, { status: 400 });
    }

    // Update all paths without category
    const result = await db.educationalPath.updateMany({
      where: { categoryId: null },
      data: { categoryId: firstCat.id }
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${result.count} paths with category: ${firstCat.name}`,
      count: result.count,
      categoryId: firstCat.id
    });
  } catch (error) {
    console.error("[BATCH_FIX_PATHS]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
