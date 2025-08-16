// import { PrismaClient } from "@prisma/client";
// import { v2 as cloudinary } from 'cloudinary'
// import { DateTime } from 'luxon';

const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');
const { DateTime } = require('luxon');

const prisma = new PrismaClient();

const NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const NEXT_PUBLIC_CLOUDINARY_API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const NO_LETTER_MEDIA_LINK = process.env.NO_LETTER_MEDIA_LINK;


cloudinary.config({
    cloud_name: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});


interface AttendanceRequestToMedia {
    requestid: string;
    mediaid: string;
};

interface Media {
    mediaid: string;
    mediaurl: string;
    reason: string;
    AttendanceRequestToMedia: AttendanceRequestToMedia[];
};


function add5hours30minutes (date: Date): Date
{
    const noOfMillisecondsIn5hours30minutes = 5.5 * 60 * 60 * 1000;
    return new Date(date.getTime() + noOfMillisecondsIn5hours30minutes);
}


const deleteUnrequiredFilesAndData = async () => {
    try {
        const ISTNow = DateTime.now().setZone('Asia/Kolkata');
        const ISTTodayMidnight = ISTNow.startOf('day');
        const ISTTodayMidnightToUTC = ISTTodayMidnight.toJSDate();

        console.log(`Deleting requests before ${ISTTodayMidnightToUTC}`);
    
        const deletedRequests = await prisma.attendanceRequest.deleteMany({
            where: {
                date: {
                    lt: ISTTodayMidnightToUTC
                }
            }
        });

        console.log(deletedRequests);
        console.log(deletedRequests.length);
    
        const mediaFilesToBeDeleted = await prisma.media.findMany({
            where: {
                AttendanceRequestToMedia: {
                    none: {}
                }
            },
            include: {
                AttendanceRequestToMedia: true
            }
        });
    
        const mediaFileURLs = new Set<string>()
    
        mediaFilesToBeDeleted.forEach((mediaFile: Media) => {
            mediaFileURLs.add(mediaFile.mediaurl);
        });

        const deletedMediaRecords = await prisma.media.deleteMany({
            where: {
                mediaurl: {
                    in: Array.from(mediaFileURLs)
                }
            }
        });

        console.log(deletedMediaRecords);
    
        mediaFileURLs.delete(NO_LETTER_MEDIA_LINK!);

        console.log(mediaFilesToBeDeleted);
        console.log(mediaFilesToBeDeleted.length);

        const mediaFileURLsArray = Array.from(mediaFileURLs)
    
        const mediaFilePublicIDsToBeDeleted = mediaFileURLsArray.map((url: string) => {
            const publicIDWithExtension = url.split('/').pop();
            const publicID = publicIDWithExtension?.split('.')[0];
            return publicID!;
        });

        console.log(mediaFilePublicIDsToBeDeleted);

        const setsOf100MediaFilePublicIDsToBeDeleted: string[][] = [];

        const noOfSets = Math.ceil(mediaFilePublicIDsToBeDeleted.length / 100);

        for(let i = 0; i < noOfSets; i++)
        {
            const start = i * 100;
            const end = Math.min((i + 1) * 100, mediaFilePublicIDsToBeDeleted.length)
            const ithSetOf100 = mediaFilePublicIDsToBeDeleted.slice(start, end);
            setsOf100MediaFilePublicIDsToBeDeleted.push(ithSetOf100);
        }

        console.log(setsOf100MediaFilePublicIDsToBeDeleted);

        const responses = [];

        for(let setOf100 of setsOf100MediaFilePublicIDsToBeDeleted)
        {
            if (setOf100.length !== 0)
            {
                const response = await cloudinary.api.delete_resources(setOf100);
                responses.push(response);
            }
        }
      
        console.log(responses);    
    }
    catch (error) {
        console.log(error);
    }
    finally {

    }
}

deleteUnrequiredFilesAndData();