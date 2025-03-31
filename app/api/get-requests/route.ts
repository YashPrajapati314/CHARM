import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { text } from "stream/consumers";

const prisma = new PrismaClient();

const add5hours30minutes = (date: Date) => {
    const noOfMillisecondsIn5hours30minutes = 5.5 * 60 * 60 * 1000;
    return new Date(date.getTime() + noOfMillisecondsIn5hours30minutes);
}

interface Request {
    lectureIds: string[];
    today: string;
}

export async function POST(req: NextRequest) {
    try
    {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        
        const { lectureIds, today } = await req.json() as Request;

        console.log('Timezone Debug Info Get Requests');
        console.log(today);
        console.log(new Date(today));
        console.log(days[(new Date(today)).getDay()]);
        
        const query = `
        SELECT arq.sapid, std.name, std.rollno, std.batchid, arq.weekday, arq.letterstatus, m.mediaurl FROM attendancerequest arq
        JOIN attendancerequesttomedia arqm ON arq.requestid = arqm.requestid
        JOIN media m ON arqm.mediaid = m.mediaid
        JOIN student std ON arq.sapid = std.sapid
        JOIN studentmodulebooking stdmod ON std.sapid = stdmod.sapid
        JOIN schedule sch ON stdmod.course_code = sch.subject
        WHERE sch.weekday = arq.weekday AND std.batchid = sch.batchid AND arq.date = CURRENT_DATE AND sch.lectureid IN '${lectureIds}';
        `;
        
        const lectureDay = await prisma.schedule.findFirst({
            where: {
                lectureid: {
                    in: lectureIds
                }
            }
        });

        if(!lectureDay)
        {
            console.log('404 Lecture Not Found');
            return NextResponse.json({ requests: [] }, { status: 404 });
        }
        
        if(lectureDay?.weekday !== days[(new Date(today)).getDay()])
        {
            console.log('400 Not on today\'s date');
            return NextResponse.json({ requests: [] }, { status: 400 });
        }
        
        const attendanceRequests = await prisma.attendanceRequest.findMany({
            where: {
                date: (new Date(today)),
                weekday: days[(new Date(today)).getDay()],
                Student: {
                    Batch: {
                        is: {
                            Schedules: {
                                some: {
                                    lectureid: {
                                        in: lectureIds
                                    }
                                }
                            }
                        }
                    },
                    StudentModuleBookings: {
                        some: {
                            Module: {
                                Schedule: {
                                    some: {
                                        lectureid: {
                                            in: lectureIds
                                        }
                                    }
                                }
                            }
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
                Student: {
                    include: {
                        StudentModuleBookings: {
                            include: {
                                Module: {
                                    include: {
                                        Schedule: {
                                            include: {
                                                Batch: true
                                            },
                                            where: {
                                                lectureid: {
                                                    in: lectureIds
                                                }
                                            }
                                        },
                                    }
                                }
                            }
                        }
                    }
                }
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