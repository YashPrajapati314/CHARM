import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const validYear = (year: string) => {
    const validYears = ['FE', 'SE', 'TE', 'BE'];
    if(validYears.includes(year))
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
        const searchParams = req.nextUrl.searchParams;
        
        const year = searchParams.get('year') || '';

        console.log('hi year');
        console.log(year);
        console.log('hi year');
        
        if(!validYear(year))
        {
            return NextResponse.json({ error: `Invalid Year` }, { status: 400 });
        }

        const departments = await prisma.department.findMany(
            {
                select:
                {
                    departmentname: true,
                    order: true,
                    shorthand: true
                }
            }
        );

        const sortedDepartments = departments.sort((a, b) => a.order - b.order);

        return NextResponse.json({ departments: sortedDepartments }, { status: 200 });
    }
    catch(error)
    {
        console.error('Error fetching departments', error);
        return NextResponse.json({ error: `Internal Server Error (${error})` }, { status: 500 });
    }
}