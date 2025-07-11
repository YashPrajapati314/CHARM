import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { text } from "stream/consumers";

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

export async function POST(req: NextRequest) {
    try
    {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        
        const { batchIds, today } = await req.json() as Request;

        console.log('Timezone Debug Info Get Requests');
        console.log(today);
        console.log(new Date(today));
        console.log(days[(new Date(today)).getDay()]);
        console.log(batchIds);

        const allBatchesExist = await checkIfAllBatchesAreValid(batchIds);

        if(!allBatchesExist)
        {
            return NextResponse.json({ error: `One or more of the requested batches do not exist` }, { status: 400 });
        }
        
        // There was no need to add5hours30mins before this
        const attendanceRequests = await prisma.attendanceRequest.findMany({
            where: {
                date: add5hours30minutes(new Date(today)),
                weekday: days[add5hours30minutes(new Date(today)).getDay()],
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
                    imagelinks: request.AttendanceRequestToMedia?.map(mediaObject => mediaObject?.Media?.mediaurl)
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
                        imagelinks: request.AttendanceRequestToMedia?.map(mediaObject => mediaObject?.Media?.mediaurl)
                    }]
                });
            }
        });


        // console.dir({finalAttendanceRequests},{depth:null});

        console.log(finalAttendanceRequests);

        return NextResponse.json({ requests: finalAttendanceRequests }, { status: 200 });
    }
    catch(error)
    {
        // console.error('Error fetching attendance', error);
        return NextResponse.json({ error: `Internal Server Error (${error})`}, { status: 500 });
    }
}