import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  const courseId = Number(params.courseId);
  const session = await auth();
  const userId = session.sessionClaims?.sub as string | undefined;

  if (!courseId || !userId) {
    return new Response("Missing courseId or userId", { status: 400 });
  }

  // Find user by userId
  const user = await prisma.user.findUnique({
    where: { providerId: userId },
    select: { firstName: true, lastName: true, id: true }
  });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Find course by id, include author
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      author: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
        }
      }
    }
  });

  if (!course) {
    return new Response("Course not found", { status: 404 });
  }

  // Check if user is enrolled in course
  const userCourse = await prisma.userCourse.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId
      }
    }
  });

  if (!userCourse) {
    return new Response("User is not enrolled in this course", { status: 403 });
  }

  // Load TTF font
  const fontPath = path.resolve(process.cwd(), "public/fonts/OpenSans-Regular.ttf");
  const fontBytes = fs.readFileSync(fontPath);

  // Load SVG logo and embed as PNG
  const logoPath = path.resolve(process.cwd(), "public/logo-extended.svg");
  const logoSvg = fs.readFileSync(logoPath, "utf8");
  // Convert SVG to PNG Buffer (requires sharp)
  const sharp = require("sharp");
  const logoPngBuffer = await sharp(Buffer.from(logoSvg)).png().toBuffer();

  // Generate PDF certificate
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const page = pdfDoc.addPage([600, 400]);
  const customFont = await pdfDoc.embedFont(new Uint8Array(fontBytes));

  // Embed logo PNG
  const pngImage = await pdfDoc.embedPng(logoPngBuffer);
  const pngDims = pngImage.scale(0.22);

  // Draw a light border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: 560,
    height: 360,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 2,
    color: rgb(1, 1, 1),
    opacity: 0.98,
  });

  // Draw logo in bottom right with increased margin from the bottom
  const logoMarginRight = 40;
  const logoMarginBottom = 30; // Increased margin from the bottom
  page.drawImage(pngImage, {
    x: 600 - pngDims.width - logoMarginRight,
    y: logoMarginBottom,
    width: pngDims.width,
    height: pngDims.height,
  });

  // Centered title
  const title = "Certyfikat ukończenia kursu";
  const titleFontSize = 30;
  const titleWidth = customFont.widthOfTextAtSize(title, titleFontSize);
  page.drawText(title, {
    x: (600 - titleWidth) / 2,
    y: 330,
    size: titleFontSize,
    font: customFont,
    color: rgb(0.2, 0.2, 0.7),
  });

  // Centered recipient name
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`;
  const nameFontSize = 24;
  const nameWidth = customFont.widthOfTextAtSize(name, nameFontSize);
  page.drawText(name, {
    x: (600 - nameWidth) / 2,
    y: 260,
    size: nameFontSize,
    font: customFont,
    color: rgb(0, 0, 0),
  });

  // Centered subtitle
  const subtitle = "ukończył(a) kurs:";
  const subtitleFontSize = 16;
  const subtitleWidth = customFont.widthOfTextAtSize(subtitle, subtitleFontSize);
  page.drawText(subtitle, {
    x: (600 - subtitleWidth) / 2,
    y: 230,
    size: subtitleFontSize,
    font: customFont,
    color: rgb(0, 0, 0),
  });

  // Centered course title
  const courseTitle = course.title;
  const courseFontSize = 20;
  const courseWidth = customFont.widthOfTextAtSize(courseTitle, courseFontSize);
  page.drawText(courseTitle, {
    x: (600 - courseWidth) / 2,
    y: 200,
    size: courseFontSize,
    font: customFont,
    color: rgb(0.1, 0.4, 0.1),
  });

  // Add padding above and below author info
  const authorPaddingTop = 10;
  const authorPaddingBottom = 16;

  // Author info below course title
  const authorName = course.author
    ? `Autor kursu: ${course.author.displayName ? course.author.displayName : `${course.author.firstName ?? ""} ${course.author.lastName ?? ""}`}`.trim()
    : "Autor kursu: ";
  const authorFontSize = 12;
  const authorWidth = customFont.widthOfTextAtSize(authorName, authorFontSize);
  page.drawText(authorName, {
    x: (600 - authorWidth) / 2,
    y: 200 - authorPaddingTop - authorFontSize, // 200 - 10 - 12 = 178
    size: authorFontSize,
    font: customFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Gratulatory message below with extra padding
  const message = "Serdecznie gratulujemy ukończenia kursu i życzymy dalszych sukcesów!";
  const messageFontSize = 13;
  const messageWidth = customFont.widthOfTextAtSize(message, messageFontSize);
  page.drawText(message, {
    x: (600 - messageWidth) / 2,
    y: 200 - authorPaddingTop - authorFontSize - authorPaddingBottom - messageFontSize, // 178 - 16 - 13 = 149
    size: messageFontSize,
    font: customFont,
    color: rgb(0.1, 0.3, 0.1),
  });

  // Date (bottom left)
  page.drawText(`Data wydania: ${new Date().toLocaleDateString("pl-PL")}`, {
    x: 40,
    y: 60,
    size: 12,
    font: customFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  const pdfBytes = await pdfDoc.save();

  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certyfikat.pdf"`,
    },
  });
}