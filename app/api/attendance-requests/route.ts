import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Student } from "@prisma/client";
import { CldImage, getCldImageUrl } from 'next-cloudinary';


interface LetterDetails {
    imageLinks: string[];
    reason: string;
}

interface StudentWithLetterStatus extends Student {
    letterstatus: number
};

interface Response {
    hasLetters: boolean;
    studentDetails: StudentWithLetterStatus[];
    letterDetails: LetterDetails;
    attendanceDates: Date[];
    manuallyEnteredDates?: Date[];
    uploaderId: string;
}


const prisma = new PrismaClient();


const postWithLetters = async (studentDetails: StudentWithLetterStatus[], letterDetails: LetterDetails, attendanceDates: Date[], manuallyEnteredDates: Date[], uploaderId: string): Promise<number> => {
    const imageLinks: string[] = letterDetails.imageLinks;
    const reason: string = letterDetails.reason;
    
    console.log(imageLinks);

    const imageRows = await prisma.media.createManyAndReturn({
        data: imageLinks.map(link => ({
            mediaurl: link,
            reason: reason
        }))
    });

    console.log(`...`);
    console.log(attendanceDates);
    console.log(`...`);

    const pairOfStudentAndDate = studentDetails.flatMap((student) => {
        return attendanceDates.map((attendanceDate) => ({
            sapid: student.sapid,
            letterstatus: manuallyEnteredDates.includes(attendanceDate) ? 2 : student.letterstatus,
            date: attendanceDate,
            weekday: "N/A",
            uploadedby: uploaderId
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

    return finalRelationalUpload.count;
}


const postWithoutLetters = async (studentDetails: StudentWithLetterStatus[], letterDetails: LetterDetails, attendanceDates: Date[], uploaderId: string): Promise<number> => {
    const NO_LETTER_MEDIA_LINK = process.env.NO_LETTER_MEDIA_LINK || letterDetails.imageLinks[0] || '';
    
    const reason: string = letterDetails.reason;

    const noImageRow = await prisma.media.create({
        data: {
            mediaurl: NO_LETTER_MEDIA_LINK,
            reason: reason
        }
    });

    console.log(`...`);
    console.log(attendanceDates);
    console.log(`...`);

    const pairOfStudentAndDate = studentDetails.flatMap((student: any) => {
        return attendanceDates.map((attendanceDate: Date) => ({
            sapid: student.sapid,
            letterstatus: student.letterstatus,
            date: attendanceDate,
            weekday: "N/A",
            uploadedby: uploaderId
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

    return finalRelationalUpload.count;
}


export async function POST(req: NextRequest) {
    try
    {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        
        const {hasLetters, studentDetails, letterDetails, attendanceDates, manuallyEnteredDates, uploaderId} = await req.json() as Response;

        let uploadedPairCount;

        if (hasLetters) {
            const manuallyEnteredDatesArray: Date[] = manuallyEnteredDates || [];
            uploadedPairCount = await postWithLetters(studentDetails, letterDetails, attendanceDates, manuallyEnteredDatesArray, uploaderId);
        }
        else {
            uploadedPairCount = await postWithoutLetters(studentDetails, letterDetails, attendanceDates, uploaderId);
        }
        
        return NextResponse.json({uploadedRequestImagePairs: uploadedPairCount});
    }
    catch (error)
    {
        console.error(`Error posting attendance requests: ${error}`);
        return NextResponse.json({ error: `Internal Server Error (${error})` }, { status: 500 });
    }
}