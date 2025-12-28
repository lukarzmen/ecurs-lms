import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typesParam = searchParams.get("types");

    const where = {
      isActive: true,
      ...(typesParam
        ? {
            type: {
              in: typesParam
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean) as any,
            },
          }
        : {}),
    };

    const versions = await db.legalDocumentVersion.findMany({
      where,
      orderBy: [{ type: "asc" }, { effectiveAt: "desc" }],
      select: {
        id: true,
        type: true,
        version: true,
        effectiveAt: true,
        lastUpdatedAt: true,
        contentFormat: true,
        contentHash: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("[GET /api/legal/versions] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
