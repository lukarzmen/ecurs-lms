import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import fs from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const awaitedParams = await params;
  const courseId = Number(awaitedParams.courseId);
  const session = await auth();
  const userId = session.sessionClaims?.sub as string | undefined;

  if (!courseId || !userId) {
    return new Response("Missing courseId or userId", { status: 400 });
  }

  // Find user by userId
  const user = await db.user.findUnique({
    where: { providerId: userId },
    select: { firstName: true, lastName: true, id: true },
  });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Find course by id, include author
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      author: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
        },
      },
    },
  });

  if (!course) {
    return new Response("Course not found", { status: 404 });
  }

  // Check if user is enrolled in course
  const userCourse = await db.userCourse.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
  });

  if (!userCourse) {
    return new Response("User is not enrolled in this course", { status: 403 });
  }

  // Generate professional certificate number
  // Format: ECURS-YYYY-MMDD-CXXXXXX-UXXXXXX-XXXXXXXX (Year-Date-CourseId-UserId-GUID)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateComponent = `${month}${day}`; // MMDD
  
  // Generate GUID - use uuid or fallback to timestamp
  let guid: string;
  try {
    guid = uuidv4().split("-")[0].toUpperCase(); // First 8 chars of UUID
  } catch {
    guid = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  
  const certNumber = `ECURS-${year}-${dateComponent}-C${String(courseId).padStart(6, "0")}-U${String(user.id).padStart(6, "0")}-${guid}`;

  // Load modern fonts - Lato is contemporary and clean
  const fontsDir = path.resolve(process.cwd(), "public/fonts");
  const tryLoad = (names: string[]): Uint8Array => {
    for (const n of names) {
      const p = path.join(fontsDir, n);
      if (fs.existsSync(p)) return new Uint8Array(fs.readFileSync(p));
    }
    throw new Error(`No font found from ${names.join(", ")}`);
  };
  // Use Lato Black for main headings (very modern and bold)
  const headingFontBytes = tryLoad(["Lato-Black.ttf", "Lato-Bold.ttf"]);
  // Use Lato Bold for secondary headings and emphasis
  const bodyFontBytes = tryLoad(["Lato-Bold.ttf", "Lato-Regular.ttf"]);

  // Load SVG logo and embed as PNG
  const logoPath = path.resolve(
    process.cwd(),
    "public/logo-extended.svg"
  );
  const logoSvg = fs.readFileSync(logoPath, "utf8");
  // Convert SVG to PNG Buffer (requires sharp)
  const sharp = require("sharp");
  const logoPngBuffer = await sharp(Buffer.from(logoSvg)).png().toBuffer();

  // Generate PDF certificate
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  // Page size - A4 landscape for a nice certificate look
  const pageWidth = 842;
  const pageHeight = 595;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const headingFont = await pdfDoc.embedFont(headingFontBytes);
  const bodyFont = await pdfDoc.embedFont(bodyFontBytes);
  const fallbackFont = headingFont; // for any accidental reference

  // Embed logo PNG
  const pngImage = await pdfDoc.embedPng(logoPngBuffer);
  const pngDims = pngImage.scale(0.25);

  // Premium gradient-like background effect with multiple rectangles
  // Dark blue bottom gradient
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(0.98, 0.985, 0.99),
  });

  // Decorative top accent bar
  page.drawRectangle({
    x: 0,
    y: pageHeight - 15,
    width: pageWidth,
    height: 15,
    color: rgb(0.1, 0.5, 0.8),
  });

  // Decorative bottom accent bar
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: 15,
    color: rgb(0.95, 0.55, 0.2),
  });

  // Premium outer frame
  page.drawRectangle({
    x: 30,
    y: 30,
    width: pageWidth - 60,
    height: pageHeight - 60,
    borderColor: rgb(0.1, 0.5, 0.8),
    borderWidth: 3,
    color: rgb(1, 1, 1),
    opacity: 1,
  });

  // Inner decorative frame
  page.drawRectangle({
    x: 50,
    y: 50,
    width: pageWidth - 100,
    height: pageHeight - 100,
    borderColor: rgb(0.95, 0.55, 0.2),
    borderWidth: 1.5,
    opacity: 0.8,
  });

  // Watermark with premium styling
  const watermark = "ECURS";
  const wmSize = 180;
  const wmWidth = headingFont.widthOfTextAtSize(watermark, wmSize);
  page.drawText(watermark, {
    x: (pageWidth - wmWidth) / 2,
    y: (pageHeight - wmSize) / 2 - 40,
    size: wmSize,
    font: headingFont,
    color: rgb(0.1, 0.5, 0.8),
    opacity: 0.08,
    rotate: degrees(25),
  });

  // Draw logo in top right
  const logoMarginRight = 50;
  const logoMarginTop = 40;
  page.drawImage(pngImage, {
    x: pageWidth - pngDims.width - logoMarginRight,
    y: pageHeight - pngDims.height - logoMarginTop,
    width: pngDims.width,
    height: pngDims.height,
  });

  // Decorative corner elements
  const cornerSize = 25;
  const cornerColor = rgb(0.95, 0.55, 0.2);
  
  // Top-left corner accent
  page.drawRectangle({
    x: 50,
    y: pageHeight - 50 - cornerSize,
    width: cornerSize,
    height: cornerSize,
    color: cornerColor,
    opacity: 0.3,
  });

  // Bottom-right corner accent
  page.drawRectangle({
    x: pageWidth - 50 - cornerSize,
    y: 50,
    width: cornerSize,
    height: cornerSize,
    color: rgb(0.1, 0.5, 0.8),
    opacity: 0.3,
  });

  // Decorative top elements - elegant dots pattern
  const dotRadius = 3;
  for (let i = 0; i < 5; i++) {
    const xPos = 150 + i * 140;
    page.drawCircle({
      x: xPos,
      y: pageHeight - 80,
      size: dotRadius,
      color: rgb(0.95, 0.55, 0.2),
      opacity: 0.4,
    });
  }

  // Friendly title with shadow effect
  const title = "Certyfikat Ukończenia";
  let titleFontSize = 52;
  let titleWidth = headingFont.widthOfTextAtSize(title, titleFontSize);
  
  // Title shadow
  page.drawText(title, {
    x: (pageWidth - titleWidth) / 2 + 1,
    y: pageHeight - 150 - 2,
    size: titleFontSize,
    font: headingFont,
    color: rgb(0.8, 0.8, 0.8),
    opacity: 0.4,
  });
  
  // Title main
  page.drawText(title, {
    x: (pageWidth - titleWidth) / 2,
    y: pageHeight - 150,
    size: titleFontSize,
    font: headingFont,
    color: rgb(0.1, 0.5, 0.8),
  });

  // Decorative line under title
  page.drawRectangle({
    x: (pageWidth - 200) / 2,
    y: pageHeight - 170,
    width: 200,
    height: 2,
    color: rgb(0.95, 0.55, 0.2),
  });

  // "Niniejszym potwierdzamy" subtitle
  const confirmationText = "Niniejszym potwierdzamy, że";
  const confirmationFontSize = 14;
  const confirmationWidth = bodyFont.widthOfTextAtSize(confirmationText, confirmationFontSize);
  page.drawText(confirmationText, {
    x: (pageWidth - confirmationWidth) / 2,
    y: pageHeight - 210,
    size: confirmationFontSize,
    font: bodyFont,
    color: rgb(0.35, 0.35, 0.38),
  });

  // Recipient name – highlight with box
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Uczestnik";
  let nameFontSize = 42;
  let nameWidth = headingFont.widthOfTextAtSize(name, nameFontSize);
  while (nameWidth > pageWidth - 200 && nameFontSize > 24) {
    nameFontSize -= 1;
    nameWidth = headingFont.widthOfTextAtSize(name, nameFontSize);
  }

  // Name background box - gradient-like effect
  page.drawRectangle({
    x: (pageWidth - nameWidth - 60) / 2,
    y: pageHeight - 290,
    width: nameWidth + 60,
    height: nameFontSize + 30,
    color: rgb(0.1, 0.5, 0.8),
    opacity: 0.08,
  });

  // Name underline
  page.drawRectangle({
    x: (pageWidth - nameWidth) / 2 - 30,
    y: pageHeight - 305,
    width: nameWidth + 60,
    height: 3,
    color: rgb(0.95, 0.55, 0.2),
  });

  page.drawText(name, {
    x: (pageWidth - nameWidth) / 2,
    y: pageHeight - 260,
    size: nameFontSize,
    font: headingFont,
    color: rgb(0.1, 0.3, 0.5),
  });

  // "successfully completed" text
  const successText = "z sukcesem ukończył(a) kurs:";
  const successFontSize = 15;
  const successWidth = bodyFont.widthOfTextAtSize(successText, successFontSize);
  page.drawText(successText, {
    x: (pageWidth - successWidth) / 2,
    y: pageHeight - 320,
    size: successFontSize,
    font: bodyFont,
    color: rgb(0.3, 0.3, 0.35),
  });

  // Course title with premium styling
  let courseTitle = course.title || "(Tytuł kursu)";
  let courseFontSize = 36;
  let courseWidth = headingFont.widthOfTextAtSize(courseTitle, courseFontSize);
  while (courseWidth > pageWidth - 200 && courseFontSize > 18) {
    courseFontSize -= 1;
    courseWidth = headingFont.widthOfTextAtSize(courseTitle, courseFontSize);
  }

  // Course title background - elegant box
  page.drawRectangle({
    x: (pageWidth - courseWidth - 80) / 2,
    y: pageHeight - 390,
    width: courseWidth + 80,
    height: courseFontSize + 35,
    color: rgb(0.95, 0.55, 0.2),
    opacity: 0.12,
  });

  // Course title border
  page.drawRectangle({
    x: (pageWidth - courseWidth - 80) / 2,
    y: pageHeight - 390,
    width: courseWidth + 80,
    height: courseFontSize + 35,
    borderColor: rgb(0.95, 0.55, 0.2),
    borderWidth: 1,
    opacity: 0.3,
  });

  page.drawText(courseTitle, {
    x: (pageWidth - courseWidth) / 2,
    y: pageHeight - 360,
    size: courseFontSize,
    font: headingFont,
    color: rgb(0.1, 0.35, 0.15),
  });

  // Author info - premium style
  const authorName = course.author
    ? `Instruktor: ${course.author.displayName ? course.author.displayName : `${course.author.firstName ?? ""} ${course.author.lastName ?? ""}`}`.trim()
    : "Instruktor: -";
  const authorFontSize = 13;
  const authorWidth = bodyFont.widthOfTextAtSize(authorName, authorFontSize);
  page.drawText(authorName, {
    x: (pageWidth - authorWidth) / 2,
    y: pageHeight - 420,
    size: authorFontSize,
    font: bodyFont,
    color: rgb(0.4, 0.4, 0.42),
  });

  // Motivational message with elegant styling
  const message = "Gratulujemy Ci tego osiągnięcia! 🌟";
  let messageFontSize = 15;
  let messageWidth = bodyFont.widthOfTextAtSize(message, messageFontSize);
  while (messageWidth > pageWidth - 150 && messageFontSize > 11) {
    messageFontSize -= 1;
    messageWidth = bodyFont.widthOfTextAtSize(message, messageFontSize);
  }

  // Message highlight
  page.drawRectangle({
    x: (pageWidth - messageWidth - 40) / 2,
    y: pageHeight - 460,
    width: messageWidth + 40,
    height: messageFontSize + 15,
    color: rgb(0.1, 0.5, 0.8),
    opacity: 0.05,
  });

  page.drawText(message, {
    x: (pageWidth - messageWidth) / 2,
    y: pageHeight - 445,
    size: messageFontSize,
    font: bodyFont,
    color: rgb(0.1, 0.4, 0.65),
  });

  // Bottom decorative line
  page.drawRectangle({
    x: 100,
    y: 100,
    width: pageWidth - 200,
    height: 1,
    color: rgb(0.95, 0.55, 0.2),
    opacity: 0.5,
  });

  // Issue date on left - elegant
  page.drawText(`Wydano: ${new Date().toLocaleDateString("pl-PL")}`, {
    x: 80,
    y: 65,
    size: 11,
    font: bodyFont,
    color: rgb(0.35, 0.35, 0.38),
  });

  // Certificate number on right
  const certNumberWidth = bodyFont.widthOfTextAtSize(certNumber, 11);
  page.drawText(certNumber, {
    x: pageWidth - 80 - certNumberWidth,
    y: 65,
    size: 11,
    font: bodyFont,
    color: rgb(0.35, 0.35, 0.38),
  });

  const pdfBytes = await pdfDoc.save();

  return new Response(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certyfikat.pdf"`,
    },
  });
}