import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try
    {
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