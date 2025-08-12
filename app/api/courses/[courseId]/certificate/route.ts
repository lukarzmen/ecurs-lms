import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import fs from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const courseId = Number(params.courseId);
  const session = await auth();
  const userId = session.sessionClaims?.sub as string | undefined;

  if (!courseId || !userId) {
    return new Response("Missing courseId or userId", { status: 400 });
  }

  // Find user by userId
  const user = await prisma.user.findUnique({
    where: { providerId: userId },
    select: { firstName: true, lastName: true, id: true },
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
        },
      },
    },
  });

  if (!course) {
    return new Response("Course not found", { status: 404 });
  }

  // Check if user is enrolled in course
  const userCourse = await prisma.userCourse.findUnique({
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

  // Load base font + optional aesthetic heading/body fonts
  const fontPath = path.resolve(process.cwd(), "public/fonts/OpenSans-Regular.ttf");
  const baseFontBytes = fs.readFileSync(fontPath);
  const fontsDir = path.resolve(process.cwd(), "public/fonts");
  const tryLoad = (names: string[]): Uint8Array => {
    for (const n of names) {
      const p = path.join(fontsDir, n);
      if (fs.existsSync(p)) return new Uint8Array(fs.readFileSync(p));
    }
    return new Uint8Array(baseFontBytes);
  };
  const headingFontBytes = tryLoad([
    "Lato-Bold.ttf",
    "Lato-Regular.ttf",
    "OpenSans-SemiBold.ttf",
    "OpenSans-Regular.ttf",
  ]);
  const bodyFontBytes = tryLoad([
    "Lato-Regular.ttf",
    "OpenSans-Regular.ttf",
  ]);

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
  // Page size (kept custom, could switch to A4 landscape: [842, 595])
  const pageWidth = 600;
  const pageHeight = 400;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const headingFont = await pdfDoc.embedFont(headingFontBytes);
  const bodyFont = await pdfDoc.embedFont(bodyFontBytes);
  const fallbackFont = headingFont; // for any accidental reference

  // Embed logo PNG
  const pngImage = await pdfDoc.embedPng(logoPngBuffer);
  const pngDims = pngImage.scale(0.22);

  // Draw a light border
  page.drawRectangle({
    x: 16,
    y: 16,
    width: pageWidth - 32,
    height: pageHeight - 32,
    borderColor: rgb(0.55, 0.7, 0.75),
    borderWidth: 2.2,
    color: rgb(0.995, 0.998, 0.999),
    opacity: 0.99,
  });

  // Subtle inner panel
  page.drawRectangle({
    x: 32,
    y: 32,
    width: pageWidth - 64,
    height: pageHeight - 64,
    color: rgb(0.97, 0.985, 0.99),
    opacity: 0.65,
  });

  // Watermark
  const watermark = "ECURS";
  const wmSize = 120;
  const wmWidth = headingFont.widthOfTextAtSize(watermark, wmSize);
  page.drawText(watermark, {
    x: (pageWidth - wmWidth) / 2,
    y: (pageHeight - wmSize) / 2 - 10,
    size: wmSize,
    font: headingFont,
    color: rgb(0.9, 0.93, 0.95),
    opacity: 0.18,
    rotate: degrees(25),
  });

  // Draw logo in bottom right with increased margin from the bottom
  const logoMarginRight = 40;
  const logoMarginBottom = 30; // Increased margin from the bottom
  page.drawImage(pngImage, {
  x: pageWidth - pngDims.width - logoMarginRight,
    y: logoMarginBottom,
    width: pngDims.width,
    height: pngDims.height,
  });

  // Decorative soft background accents (confetti style squares)
  const accentColors = [
    rgb(0.95, 0.55, 0.2),
    rgb(0.2, 0.6, 0.9),
    rgb(0.3, 0.7, 0.55),
    rgb(0.85, 0.4, 0.6),
  ];
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  for (let i = 0; i < 14; i++) {
    const size = random(6, 12);
    page.drawRectangle({
  x: random(30, pageWidth - 40),
  y: random(70, pageHeight - 40),
      width: size,
      height: size,
      color: accentColors[i % accentColors.length],
      opacity: 0.15,
    });
  }

  // Friendly title
  const title = "Gratulacje!";
  let titleFontSize = 34;
  let titleWidth = headingFont.widthOfTextAtSize(title, titleFontSize);
  page.drawText(title, {
  x: (pageWidth - titleWidth) / 2,
    y: 325,
    size: titleFontSize,
    font: headingFont,
    color: rgb(0.15, 0.45, 0.7),
  });

  // Recipient name – highlight
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Uczestnik";
  let nameFontSize = 26;
  let nameWidth = headingFont.widthOfTextAtSize(name, nameFontSize);
  if (nameWidth > 500) {
    while (nameWidth > 500 && nameFontSize > 14) {
      nameFontSize -= 1;
      nameWidth = headingFont.widthOfTextAtSize(name, nameFontSize);
    }
  }
  page.drawText(name, {
  x: (pageWidth - nameWidth) / 2,
    y: 285,
    size: nameFontSize,
    font: headingFont,
    color: rgb(0.1, 0.35, 0.15),
  });

  // Subtitle friendlier
  const subtitle = "ukończył(a) kurs:";
  const subtitleFontSize = 16;
  const subtitleWidth = bodyFont.widthOfTextAtSize(subtitle, subtitleFontSize);
  page.drawText(subtitle, {
  x: (pageWidth - subtitleWidth) / 2,
    y: 258,
    size: subtitleFontSize,
    font: bodyFont,
    color: rgb(0.25, 0.25, 0.45),
  });

  // Course title with dynamic sizing and soft highlight bar
  let courseTitle = course.title || "(Tytuł kursu)";
  let courseFontSize = 22;
  let courseWidth = headingFont.widthOfTextAtSize(courseTitle, courseFontSize);
  while (courseWidth > 520 && courseFontSize > 12) {
    courseFontSize -= 1;
    courseWidth = headingFont.widthOfTextAtSize(courseTitle, courseFontSize);
  }
  // highlight bar
  page.drawRectangle({
    x: (pageWidth - (courseWidth + 46)) / 2,
    y: 225 - 10,
    width: courseWidth + 46,
    height: courseFontSize + 20,
    color: rgb(0.9, 0.97, 0.965),
    opacity: 0.92,
  });
  page.drawText(courseTitle, {
  x: (pageWidth - courseWidth) / 2,
    y: 230,
    size: courseFontSize,
  font: headingFont,
    color: rgb(0.1, 0.5, 0.35),
  });

  // Author info (renamed label to be casual)
  const authorPaddingTop = 10;
  const authorPaddingBottom = 14;
  const authorName = course.author
    ? `Prowadzący: ${course.author.displayName ? course.author.displayName : `${course.author.firstName ?? ""} ${course.author.lastName ?? ""}`}`.trim()
    : "Prowadzący: -";
  const authorFontSize = 12.5;
  const authorWidth = bodyFont.widthOfTextAtSize(authorName, authorFontSize);
  page.drawText(authorName, {
  x: (pageWidth - authorWidth) / 2,
    y: 200,
    size: authorFontSize,
    font: bodyFont,
    color: rgb(0.35, 0.35, 0.38),
  });

  // Bardziej motywujące hasło
  const message = "Każdy etap wzmacnia Twoje umiejętności – kolejne sukcesy są blisko! 🚀";
  let messageFontSize = 13.5;
  let messageWidth = bodyFont.widthOfTextAtSize(message, messageFontSize);
  while (messageWidth > 520 && messageFontSize > 10) {
    messageFontSize -= 1;
    messageWidth = bodyFont.widthOfTextAtSize(message, messageFontSize);
  }
  page.drawText(message, {
  x: (pageWidth - messageWidth) / 2,
    y: 200 - authorPaddingBottom - messageFontSize - 4,
    size: messageFontSize,
    font: bodyFont,
    color: rgb(0.2, 0.5, 0.25),
  });

  // Data (lewy dół)
  page.drawText(`Data wydania: ${new Date().toLocaleDateString("pl-PL")}` , {
    x: 40,
    y: 50,
    size: 11,
    font: bodyFont,
    color: rgb(0.32, 0.32, 0.35),
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