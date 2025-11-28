import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { User } from "@prisma/client";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { universityid, enteredPassword } = await req.json();

        const user = await prisma.user.findFirst({ where: { universityid } });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });  
        }
        
        if (!user.password) {
            return NextResponse.json({ error: "Password not set" }, { status: 404 });  
        }

        const match = await bcrypt.compare(enteredPassword, user.password);
        
        if (!match) {
            return NextResponse.json({ error: "Invalid Password" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    }
    catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}
