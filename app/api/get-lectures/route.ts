import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try
    {
        const { teacherId, today } = await req.json();

        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        console.log('Timezone Debug Info Get Lectures');
        console.log(today);
        console.log(new Date(today));
        console.log(days[(new Date(today)).getDay()]);

        const lectures = await prisma.schedule.findMany(
            { 
                where: {
                    teacher: {in: [teacherId]},
                    weekday: {in: [days[(new Date(today)).getDay()]]}
                },
                select: {
                    lectureid: true,
                    subject: true,
                    starttime: true,
                    endtime: true,
                    batchid: true,
                    Module: {
                        select : {
                            course_name: true,
                            course_code: true
                        }
                    }
                }
            }
        );

        lectures.sort((a, b) => (a.starttime === b.starttime ? (a.batchid.localeCompare(b.batchid)) : (a.starttime > b.starttime ? 1 : -1)));

        return NextResponse.json({ lectures }, { status: 200 });
    }
    catch(error)
    {
        console.error('Error fetching students', error);
        return NextResponse.json({ error: `Internal Server Error (${error})`}, { status: 500 });
    }
}