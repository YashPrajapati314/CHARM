import { NextResponse, NextRequest } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";

type YearShorthand = "FE" | "SE" | "TE" | "BE";

const yearMap: Record<YearShorthand, number> = {
    FE: 1,
    SE: 2,
    TE: 3,
    BE: 4
};


export async function GET(req: NextRequest) {
    try
    {
        const searchParams = req.nextUrl.searchParams;
        
        const year = searchParams.get('year') as YearShorthand;
        const department = searchParams.get('department') as string;
        
        const prisma = new PrismaClient();

        if(yearMap[year] === undefined)
        {
            return NextResponse.json({ error: `Invalid Year`}, { status: 400 });
        }
        
        const batches = await prisma.batch.findMany(
            {
                where: {
                    dept: department,
                    // studyyear: yearMap[year] || 0
                },
                select: {
                    batchid: true,
                    studyyear: true,
                    dept: true,
                    div: true,
                    batch: true
                }
            }
        );

        if(batches.length === 0)
        {
            return NextResponse.json({ error: `Invalid Department`}, { status: 400 });
        }

        const yearFilteredBatches = batches.filter(batch => batch.studyyear === yearMap[year]);

        yearFilteredBatches.sort((a, b) => (a.div - b.div || a.batch - b.batch));

        return NextResponse.json({ batches: yearFilteredBatches }, { status: 200 });
    }
    catch (error)
    {
        // console.error('Error fetching lecture details', error);
        return NextResponse.json({ error: `Internal Server Error (${error})`}, { status: 500 });
    }
}