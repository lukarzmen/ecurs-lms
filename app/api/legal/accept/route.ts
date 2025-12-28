import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { LegalDocumentType } from "@prisma/client";

type AcceptRequestBody = {
  type: LegalDocumentType;
  version: string;
  effectiveAt: string;
  lastUpdatedAt?: string;
  content?: string;
  contentFormat?: string;
  contentHash?: string;
  locale?: string;
  context?: string;
};

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }
  return request.headers.get("x-real-ip");
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as AcceptRequestBody;

    if (!body?.type || !body?.version || !body?.effectiveAt) {
      return NextResponse.json(
        { error: "Missing required fields: type, version, effectiveAt" },
        { status: 400 }
      );
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || null;

    // Find the user in our DB.
    let user = await db.user.findUnique({ where: { providerId: userId } });

    // Fallback for cases where providerId hasn't been synced yet.
    if (!user && email) {
      const userByEmail = await db.user.findUnique({ where: { email } });
      if (userByEmail) {
        user = await db.user.update({
          where: { id: userByEmail.id },
          data: { providerId: userId, updatedAt: new Date() },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const effectiveAt = new Date(body.effectiveAt);
    if (Number.isNaN(effectiveAt.getTime())) {
      return NextResponse.json({ error: "Invalid effectiveAt" }, { status: 400 });
    }

    const lastUpdatedAt = body.lastUpdatedAt ? new Date(body.lastUpdatedAt) : null;
    if (lastUpdatedAt && Number.isNaN(lastUpdatedAt.getTime())) {
      return NextResponse.json({ error: "Invalid lastUpdatedAt" }, { status: 400 });
    }

    const documentType = body.type;
    const version = body.version.trim();

    const documentVersion = await db.legalDocumentVersion.upsert({
      where: {
        type_version: {
          type: documentType,
          version,
        },
      },
      create: {
        type: documentType,
        version,
        effectiveAt,
        lastUpdatedAt: lastUpdatedAt ?? undefined,
        content: body.content ?? undefined,
        contentFormat: body.contentFormat ?? "text",
        contentHash: body.contentHash ?? undefined,
        isActive: true,
      },
      update: {
        isActive: true,
        effectiveAt,
        lastUpdatedAt: lastUpdatedAt ?? undefined,
        content: body.content ?? undefined,
        contentFormat: body.contentFormat ?? undefined,
        contentHash: body.contentHash ?? undefined,
      },
      select: { id: true, type: true, version: true },
    });

    const acceptance = await db.legalDocumentAcceptance.upsert({
      where: {
        userId_documentVersionId: {
          userId: user.id,
          documentVersionId: documentVersion.id,
        },
      },
      create: {
        userId: user.id,
        documentVersionId: documentVersion.id,
        documentType,
        locale: body.locale ?? undefined,
        context: body.context ?? undefined,
        ip: getClientIp(request) ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
      update: {},
      select: { id: true, acceptedAt: true },
    });

    return NextResponse.json({ ok: true, documentVersion, acceptance });
  } catch (error) {
    console.error("[POST /api/legal/accept] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
