import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export async function GET(req: NextRequest) {
    try
    {
        const searchParams = req.nextUrl.searchParams;
        
        const sapid_list = searchParams.getAll('sapid').map(Number);

        if (!Array.isArray(sapid_list) || sapid_list.length === 0)
        {
            return NextResponse.json({ error: 'Invalid SAP ID list' }, { status: 400 });
        }
        
        const tempstudents = await prisma.student.findMany(
            {
                where:
                {
                    sapid: {in: sapid_list}
                },
                select:
                {
                    sapid: true,
                    name: true,
                    rollno: true,
                    batchid: true,
                }
            }
        );

        const students = tempstudents.map(student => ({
            ...student, sapid: Number(student.sapid), letterstatus: 0
        }));

        return NextResponse.json({ students }, { status: 200 });
    }
    catch(error)
    {
        console.error('Error fetching students', error);
        return NextResponse.json({ error: `Internal Server Error (${error})`}, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try
    {
        const {sapid_list} = await req.json();

        if (!Array.isArray(sapid_list) || sapid_list.length === 0)
        {
            return NextResponse.json({ error: 'Invalid SAP ID list' }, { status: 400 });
        }
        
        const tempstudents = await prisma.student.findMany(
            {
                where:
                {
                    sapid: {in: sapid_list}
                },
                select:
                {
                    sapid: true,
                    name: true,
                    rollno: true,
                    batchid: true,
                }
            }
        );

        const students = tempstudents.map(student => ({
            ...student, sapid: Number(student.sapid), letterstatus: 0
        }));

        return NextResponse.json({ students }, { status: 200 });
    }
    catch(error)
    {
        console.error('Error fetching students', error);
        return NextResponse.json({ error: `Internal Server Error (${error})`}, { status: 500 });
    }
}