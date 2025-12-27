import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { DateTime } from "luxon";
import { EmailStatus } from "@/enums/errors-and-statuses";
import { Resend } from 'resend'; 


const prisma = new PrismaClient();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

async function storeOtpForUser(universityId: string, otp: string) {
  const otpHash = await bcrypt.hash(otp, 10);
  const otpExpiry = DateTime.now().plus({ minutes: 10 }).toUTC().toISO();

  await prisma.user.update({
    where: { universityid: universityId },
    data: { otphash: otpHash, otpexpiration: otpExpiry }
  });
}

async function sendMailUsingNodeMailer(CHARM_MAIL: string, CHARM_PASS: string, receiverEmail: string, mailSubject: string, mailContent: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: CHARM_MAIL,
      pass: CHARM_PASS
    }
  });

  await transporter.sendMail({
    from: `"CHARM Auth" <${CHARM_MAIL}>`,
    to: receiverEmail,
    subject: mailSubject,
    html: mailContent
  });
}

async function sendMailUsingResend(CHARM_MAIL: string, RESEND_API_KEY: string, receiverEmail: string, mailSubject: string, mailContent: string) {
  const resend = new Resend(RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: CHARM_MAIL,
    to: receiverEmail,
    subject: mailSubject,
    html: mailContent
  });

  if (error) {
    return false;
  }
  else {
    return true;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { universityId } = await req.json();

    console.log(universityId);

    const existingUser = await prisma.user.findUnique({
      where: { universityid: universityId }
    });

    const receiverEmail = existingUser?.email;

    console.log(receiverEmail);

    if (!existingUser) {
      return NextResponse.json({ error: "University ID not found.", errorType: EmailStatus.USER_NOT_FOUND }, { status: 404 });
    }

    if (existingUser.password) {
      return NextResponse.json({ error: "Account already exists.", errorType: EmailStatus.ACCOUNT_ALREADY_EXISTS }, { status: 400 });
    }
    
    if (!receiverEmail) {
      return NextResponse.json({ success: false, errorType: EmailStatus.USER_HAS_NO_EMAIL, message: "No email associated with the account." });
    }

    const otp = generateOtp();

    await storeOtpForUser(universityId, otp);

    const CHARM_MAIL = process.env.CHARM_MAIL || '';
    const CHARM_PASS = process.env.CHARM_PASS || '';
    const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

    const mailSubject = `Verify Your Account – CHARM`

    const mailContent = `
    <html>
      <body>
        <p>
          Someone appears to be attempting to create an account with your DJSCE University ID to CHARM (Centralized Home for Attendance Request Management) <br>
          The 6-digit One Time Password for your registration is <b>${otp}</b>. <br>
          Please do not share this OTP with anyone. If this request was not made by you, please ignore this email.
        </p>
        <p>
          You are receiving this message because this (${receiverEmail}) is the email account registered with your university profile. <br>
          If you wish to change your registered email address, please contact the university officials.
        </p>
        <p>
          Thank you for signing up to CHARM!
        </p>
      </body>
    </html>
    `;

    const result = await sendMailUsingResend(CHARM_MAIL, RESEND_API_KEY, receiverEmail, mailSubject, mailContent);

    if (result) {
      return NextResponse.json({ success: true, errorType: EmailStatus.NO_ERROR, message: "OTP sent to registered email address." });
    }
    else {
      return NextResponse.json({ error: "Mail sending failed", errorType: EmailStatus.OTHER }, { status: 500 });
    }
  }
  catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Sign up failed", errorType: EmailStatus.OTHER }, { status: 500 });
  }
}
