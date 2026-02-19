// import { PrismaClient } from "@prisma/client";
// import { v2 as cloudinary } from 'cloudinary'
// import { DateTime } from 'luxon';

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

const csvFilePath = process.env.BATCH_UPDATE_CSV;

async function updateBatchIdOfStudentsFromCSV() {
    const updatedBatches: any[] = [];

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
                sapid: BigInt(Number(row.sapid)),
                batchid: row.batchid
            };
            updatedBatches.push(formattedRow);
        })
        .on('end', async () => {
            try {
                const batches = updatedBatches.map(u => u.batchid);

                const existingBatches = await prisma.batch.findMany({
                    select: { batchid: true }
                });

                // @ts-ignore
                const existingBatchesSet = new Set(existingBatches.map(b => b.batchid));

                const missingBatches = batches.filter(batchid => !existingBatchesSet.has(batchid));

                if (missingBatches.length > 0) {
                    throw new Error(`Missing batches. The following Batch IDs do not exist in the batch table: ${missingBatches.join(', ')}`);
                }

                const SAPIDsToUpdate = updatedBatches.map(u => u.sapid);

                const existingSAPIDs = await prisma.student.findMany({
                    where: { sapid: { in: SAPIDsToUpdate } },
                    select: { sapid: true }
                });

                // @ts-ignore
                const existingSAPIDSet = new Set(existingSAPIDs.map(s => s.sapid));

                const missingSAPIDs = SAPIDsToUpdate.filter(sapid => !existingSAPIDSet.has(sapid));

                if (missingSAPIDs.length > 0) {
                    throw new Error(`Missing students. The following SAP IDs do not exist in the student table: ${missingSAPIDs.join(', ')}`);
                }
                
                await prisma.$transaction(
                    updatedBatches.map(update => 
                        prisma.student.update({
                            where: {sapid: update.sapid},
                            data: {batchid: update.batchid}
                        })
                    )
                );
                
                console.log(`Updated batches of ${updatedBatches.length} students.`);
            } catch (error) {
                console.error('Error updating batches:', error);
            } finally {
                await prisma.$disconnect();
            }
        });
}

updateBatchIdOfStudentsFromCSV();

// export {};