import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface studyYearFormat {
    studyYear: number,
    yearName: string,
    yearShorthand: string
};

export async function GET(req: NextRequest) {
    try
    {
        // const years = await prisma.batch.findMany({
        //     select:
        //     {
        //         studyyear: true
        //     },
        //     distinct: ["studyyear"]
        // });

        // const sortedYears = years.sort((a, b) => a.studyyear - b.studyyear);

        const listOfYears: studyYearFormat[] = [
            {
                studyYear: 1,
                yearName: "First Year",
                yearShorthand: "FE"
            },
            {
                studyYear: 2,
                yearName: "Second Year",
                yearShorthand: "SE"
            },
            {
                studyYear: 3,
                yearName: "Third Year",
                yearShorthand: "TE"
            },
            {
                studyYear: 4,
                yearName: "Final Year",
                yearShorthand: "BE"
            }
        ] 

        return NextResponse.json({ years: listOfYears }, { status: 200 });
    }
    catch(error)
    {
        console.error('Error fetching years', error);
        return NextResponse.json({ error: `Internal Server Error (${error})`}, { status: 500 });
    }
}