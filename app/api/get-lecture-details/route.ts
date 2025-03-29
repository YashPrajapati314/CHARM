import { NextResponse, NextRequest } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";

interface Request {
    lectureIds: string[];
}

export async function POST(req: NextRequest) {
    try
    {
        const {lectureIds} = await req.json() as Request;
        
        const prisma = new PrismaClient();
        
        const lectureDetails = await prisma.schedule.findMany(
            {
                where: {
                    lectureid: {in: lectureIds}
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