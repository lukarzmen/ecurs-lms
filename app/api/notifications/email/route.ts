import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { to, subject, text, useSSL } = await req.json();

    // Use env variables for SMTP config
    const smtpHost = process.env.SMTP_HOST || 'wordpress2502519.home.pl';
    const smtpPort = useSSL ? 465 : 587;
    const smtpSecure = !!useSSL;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

  try {
    await transporter.sendMail({
      from: `"Masz nowe powiadomienie z ecurs" <${smtpUser}>`,
      to,
      subject,
      text,
    });
    return NextResponse.json({ message: 'Email sent!' });
  } catch (error) {
      return NextResponse.json({ error: String((error as Error).message) }, { status: 500 });
  }
}