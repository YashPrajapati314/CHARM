import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { User } from "@prisma/client";
import { DateTime } from "luxon";
import { error } from "console";

enum OtpStatus {
    NO_ERROR = 0,
    OTP_INVALID = 1,
    OTP_EXPIRED = 2,
    NO_REQUEST = 3,
    BAD_REQUEST = 4,
    OTHER = 5
}

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        //// This is where I stopped
        const searchParams = req.nextUrl.searchParams;

        const universityId = searchParams.get('universityid');
        const enteredOtp = searchParams.get('enteredOtp');

        if (!universityId || !enteredOtp) {
            return NextResponse.json({ error: "University ID or OTP missing", errorType: OtpStatus.BAD_REQUEST }, { status: 400 })
        }

        const user = await prisma.user.findFirst({ where: { universityid: universityId } });

        if (!user) {
            return NextResponse.json({ error: "User not found", errorType: OtpStatus.BAD_REQUEST }, { status: 404 });  
        }

        if (!user.otphash || !user.otpexpiration) {
            return NextResponse.json({ error: "No OTP request pending", errorType: OtpStatus.NO_REQUEST }, { status: 400 });
        }

        if (user.otpexpiration < new Date()) {
            return NextResponse.json({ error: "OTP expired", errorType: OtpStatus.OTP_EXPIRED }, { status: 400 });
        }

        const match = await bcrypt.compare(enteredOtp, user.otphash);
        
        if (match) {
            return NextResponse.json({ success: true, errorType: OtpStatus.NO_ERROR });
        }
        else {
            return NextResponse.json({ error: "Invalid OTP", errorType: OtpStatus.OTP_INVALID }, { status: 400 });
        }
    }
    catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: "Verification failed", errorType: OtpStatus.OTHER }, { status: 500 });
    }
}
