import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { text } from "stream/consumers";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

const add5hours30minutes = (date: Date) => {
    const noOfMillisecondsIn5hours30minutes = 5.5 * 60 * 60 * 1000;
    return new Date(date.getTime() + noOfMillisecondsIn5hours30minutes);
}

interface Request {
    batchIds: string[];
    today: string;
}

const checkIfAllBatchesAreValid = async (batches: string[]) => {
    const dbBatchCount = await prisma.batch.count({
        where: {
            batchid: {
                in: batches
            }
        }
    });

    if(dbBatchCount === batches.length)
    {
        return true;
    }
    else
    {
        return false;
    }
}

export async function GET(req: NextRequest) {
    try
    {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        
        const searchParams = req.nextUrl.searchParams;

        const batchIds = searchParams.getAll('batchId') || '';

        const allBatchesExist = await checkIfAllBatchesAreValid(batchIds);

        if(!batchIds || !allBatchesExist)
        {
            return NextResponse.json({ error: `One or more of the requested batches do not exist` }, { status: 400 });
        }
        
        const IST = DateTime.now().setZone("Asia/Kolkata");

        const ISTMidnightToday = IST.startOf('day');
        const ISTMidnightTomorrow = ISTMidnightToday.plus({ days: 1 });
        
        const attendanceRequests = await prisma.attendanceRequest.findMany({
            where: {
                date: {
                    gte: ISTMidnightToday.toJSDate(),
                    lt: ISTMidnightTomorrow.toJSDate()
                },
                Student: {
                    Batch: {
                        batchid: {
                            in: batchIds
                        }
                    }
                }
            }, 
            include: {
                AttendanceRequestToMedia: {
                    include: {
                        Media: true
                    }
                },
                Student: true
            }
        });

        interface StudentWithRequests {
            sapid: number;
            name: string;
            rollno: number;
            batchid: string;
            listofrequests: {
                letterstatus: number;
                reason: string;
                imagelinks: string[];
                uploadedby: string;
            }[];
        }

        const finalAttendanceRequests: StudentWithRequests[] = [];

        attendanceRequests.map(request => {
            const existingStudent = finalAttendanceRequests.find(existingStudent => existingStudent.sapid === Number(request.sapid));
            if(existingStudent)
            {
                existingStudent.listofrequests.push({
                    letterstatus: request.letterstatus,
                    reason: request.AttendanceRequestToMedia[0]?.Media?.reason,
                    imagelinks: request.AttendanceRequestToMedia?.map(mediaObject => mediaObject?.Media?.mediaurl),
                    uploadedby: request.uploadedby
                });
            }
            else
            {
                finalAttendanceRequests.push({
                    sapid: Number(request.Student?.sapid),
                    name: request.Student?.name,
                    rollno: request.Student?.rollno,
                    batchid: request.Student?.batchid,
                    listofrequests: [{
                        letterstatus: request.letterstatus,
                        reason: request.AttendanceRequestToMedia[0]?.Media?.reason,
                        imagelinks: request.AttendanceRequestToMedia?.map(mediaObject => mediaObject?.Media?.mediaurl),
                        uploadedby: request.uploadedby
                    }]
                });
            }
        });


        // console.dir({finalAttendanceRequests}, {depth:null});

        console.log(finalAttendanceRequests);

        return NextResponse.json({ requests: finalAttendanceRequests }, { status: 200 });
    }
    catch(error)
    {
        // console.error('Error fetching attendance', error);
        return NextResponse.json({ error: `Internal Server Error (${error})`}, { status: 500 });
    }
}