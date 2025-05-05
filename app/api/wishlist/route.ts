import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = ["http://localhost:3000", "https://ecurs.pl"];

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");

    if (!allowedOrigins.includes(origin || "")) {
      return new NextResponse("CORS Error: Origin not allowed", { status: 403 });
    }

    const body = await req.json();
    const { name, contact } = body;

    const newWishlistItem = await db.wishlist.create({
      data: {
        name: name,
        contact: contact,
      },
    });

    const response = NextResponse.json(newWishlistItem, { status: 201 });
    response.headers.set("Access-Control-Allow-Origin", origin || ""); // Allow specific origin
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS"); // Allow specific methods
    response.headers.set("Access-Control-Allow-Headers", "Content-Type"); // Allow specific headers
    return response;

  } catch (error) {
    console.error("[WISHLIST_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");

  if (!allowedOrigins.includes(origin || "")) {
    return new NextResponse("CORS Error: Origin not allowed", { status: 403 });
  }

  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", origin || ""); // Allow specific origin
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}