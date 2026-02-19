// import { PrismaClient } from "@prisma/client";
// import { v2 as cloudinary } from 'cloudinary'
// import { DateTime } from 'luxon';

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

const csvFilePath = process.env.USER_DATA_CSV;

async function pushUserDataFromCSV() {
    const userData: any[] = [];

    fs.createReadStream(csvFilePath)
        .pipe(csv({
            // @ts-ignore
            mapHeaders: ({ header }) =>
            header
                .trim()
                .replace(/\uFEFF/g, '')   // BOM
                .replace(/\u200B/g, '')   // zero-width space
                .replace(/\u00A0/g, ''),  // non-breaking space
        }))
        .on('data', (row: any) => {
                const formattedRow = {
                universityid: row.universityid,
                password: null,
                email: row.email,
                otphash: null,
                otpexpiration: null,
                name: row.name
            };
            userData.push(formattedRow);
        })
        .on('end', async () => {
            try {
                console.log(userData);
                const result = await prisma.user.createMany({
                    data: userData,
                    skipDuplicates: true
                });
                console.log(`Added ${result.count} new users.`);
                console.log('Data successfully pushed to the database!');
            } catch (error) {
                console.error('Error pushing data:', error);
            } finally {
                await prisma.$disconnect();
            }
        });
}

pushUserDataFromCSV();

export {};