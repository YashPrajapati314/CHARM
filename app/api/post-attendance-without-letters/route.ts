import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Student } from "@prisma/client";

const prisma = new PrismaClient();

const add5hours30minutes = (date: Date) => {
    const noOfMillisecondsIn5hours30minutes = 5.5 * 60 * 60 * 1000;
    return new Date(date.getTime() + noOfMillisecondsIn5hours30minutes);
}

export async function POST(req: NextRequest) {
    try
    {
        interface LetterDetails {
            reason: string;
        }

        interface Response {
            studentDetails: Student[];
            letterDetails: LetterDetails;
            attendanceDates: Date[];
        }

        const NO_LETTER_MEDIA_LINK = process.env.NO_LETTER_MEDIA_LINK || '';

        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        
        const {studentDetails, letterDetails, attendanceDates} = await req.json() as Response;

        const reason: string = letterDetails.reason;
        const truncatedReason: string = reason.length > 256 ? reason.slice(0, 256) + '...' : reason;

        const noImageRow = await prisma.media.create({
            data: {
                mediaurl: NO_LETTER_MEDIA_LINK,
                reason: truncatedReason
            }
        });

        const pairOfStudentAndDate = studentDetails.flatMap((student: any) => {
            return attendanceDates.map((attendanceDate: Date) => ({
                sapid: student.sapid,
                letterstatus: student.letterstatus,
                date: new Date(attendanceDate),
                weekday: days[(new Date(attendanceDate)).getDay()]
            }));
        });

        const requestRows = await prisma.attendanceRequest.createManyAndReturn({
            data: pairOfStudentAndDate
        });

        const pairOfRequestsAndImages = requestRows.map((request: any) => ({
                requestid: request.requestid,
                mediaid: noImageRow.mediaid
        }));

        const finalRelationalUpload = await prisma.attendanceRequestToMedia.createMany({
            data: pairOfRequestsAndImages
        });

        console.log('Request', requestRows)
        console.log('Final Relational', finalRelationalUpload);

        return NextResponse.json({uploadedRequestImagePairs: finalRelationalUpload.count});
    }
    catch (error)
    {
        console.error(`Error posting attendance requests: ${error}`);
        return NextResponse.json({ error: `Internal Server Error (${error})` }, { status: 500 });
    }
}