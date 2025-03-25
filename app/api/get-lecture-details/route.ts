import { NextResponse, NextRequest } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";

export async function POST(req: NextRequest) {
    try
    {
        const {lectureId} = await req.json();
        
        const prisma = new PrismaClient();
        
        const lectureDetails = await prisma.schedule.findFirst(
            {
                where: {
                    lectureid: {in: [lectureId]}
                },
                select: {
                    subject: true,
                    weekday: true,
                    starttime: true,
                    endtime: true,
                    batchid: true,
                    Module: {
                        select: {
                            course_name: true
                        }
                    }
                }
            }
        );

        return NextResponse.json({ lectureDetails }, { status: 200 });
    }
    catch (error)
    {
        // console.error('Error fetching lecture details', error);
        return NextResponse.json({ error: `Internal Server Error (${error})`}, { status: 500 });
    }
}