import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, contact } = body;

    const newWishlistItem = await db.wishlist.create({
      data: {
        name: name,
        contact: contact, // contact is optional based on schema
      },
    });

    return NextResponse.json(newWishlistItem, { status: 201 }); // 201 Created status

  } catch (error) {
    console.error("[WISHLIST_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}