import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Student } from "@prisma/client";
import { CldImage, getCldImageUrl } from 'next-cloudinary';

const prisma = new PrismaClient();

const add5hours30minutes = (date: Date) => {
    const noOfMillisecondsIn5hours30minutes = 5.5 * 60 * 60 * 1000;
    return new Date(date.getTime() + noOfMillisecondsIn5hours30minutes);
}

export async function POST(req: NextRequest) {
    try
    {
        interface LetterDetails {
            imageLinks: string[];
            reason: string;
        }

        interface Response {
            studentDetails: Student[];
            letterDetails: LetterDetails;
            attendanceDates: Date[];
            manuallyEnteredDates: Date[];
        }

        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        
        const {studentDetails, letterDetails, attendanceDates, manuallyEnteredDates} = await req.json() as Response;

        const imageLinks: string[] = letterDetails.imageLinks;
        const reason: string = letterDetails.reason;
        
        console.log(imageLinks);

        const imageRows = await prisma.media.createManyAndReturn({
            data: imageLinks.map(link => ({
                mediaurl: link,
                reason: reason
            }))
        });

        const pairOfStudentAndDate = studentDetails.flatMap((student: any) => {
            return attendanceDates.map((attendanceDate: Date) => ({
                sapid: student.sapid,
                letterstatus: manuallyEnteredDates.includes(attendanceDate) ? 2 : student.letterstatus,
                date: add5hours30minutes(new Date(attendanceDate)),
                weekday: days[(new Date(attendanceDate)).getDay()]
            }))
        });

        const requestRows = await prisma.attendanceRequest.createManyAndReturn({
            data: pairOfStudentAndDate
        });

        const pairOfRequestsAndImages = requestRows.flatMap((request: any) => {
            return imageRows.map((image: any) => ({
                requestid: request.requestid,
                mediaid: image.mediaid
            }))
        });

        const finalRelationalUpload = await prisma.attendanceRequestToMedia.createMany({
            data: pairOfRequestsAndImages
        });

        console.log('Request', requestRows)
        console.log('Images', imageRows)
        console.log('Final Relational', finalRelationalUpload);
        
        return NextResponse.json({uploadedRequestImagePairs: finalRelationalUpload.count});
    }
    catch (error)
    {
        console.error(`Error posting attendance requests: ${error}`);
        return NextResponse.json({ error: `Internal Server Error (${error})` }, { status: 500 });
    }
}