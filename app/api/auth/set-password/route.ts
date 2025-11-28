import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { universityId, newPasswordHash } = await req.json();

    const existingUser = await prisma.user.update({
      where: { universityid: universityId },
      data: { password: newPasswordHash }
    });

    return NextResponse.json({ success: true });
  }
  catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Sign-up failed" }, { status: 500 });
  }
}
