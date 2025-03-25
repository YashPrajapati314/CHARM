import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try
    {
        const {searchParams} = new URL(req.url);
        const department = searchParams.get('department');

        if (!department) {
            return NextResponse.json({ error: "Department is required" }, { status: 400 });
        }

        const teachers = await prisma.teacher.findMany(
            {
                select:
                {
                    id: true,
                    title: true,
                    name: true
                },
                where:
                {
                    dept: {in: [department]}
                }
            }
        );

        return NextResponse.json({teachers: teachers}, { status: 200 });
    }
    catch(error)
    {
        console.error('Error fetching teachers', error);
        return NextResponse.json({ error: `Internal Server Error (${error})` }, { status: 500 });
    }
}