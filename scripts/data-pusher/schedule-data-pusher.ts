// const { PrismaClient } = require('@prisma/client');
// const fs = require('fs');
// const csv = require('csv-parser');

// const prisma = new PrismaClient();

// const csvFilePath = '';

// const add5hours30minutes = (date: Date) => {
//     const noOfMillisecondsIn5hours30minutes = 5.5 * 60 * 60 * 1000;
//     return new Date(date.getTime() + noOfMillisecondsIn5hours30minutes);
// }

// const convertDate = (datestring: string) => {
//     const convertedDate = add5hours30minutes(new Date('1970-01-01T' + datestring));
//     return convertedDate;
// }

// async function pushScheduleDataFromCSV() {
//     const scheduleData: any[] = [];

//     fs.createReadStream(csvFilePath)
//         .pipe(csv({
//             // @ts-ignore
//             mapHeaders: ({ header }) =>
//             header
//                 .trim()
//                 .replace(/\uFEFF/g, '')   // BOM
//                 .replace(/\u200B/g, '')   // zero-width space
//                 .replace(/\u00A0/g, ''),  // non-breaking space
//         }))
//         .on('data', (row: any) => {
//             const formattedRow = {
//                 batchid: row.batchid,
//                 weekday: row.weekday,
//                 starttime: convertDate(row.starttime),
//                 endtime: convertDate(row.endtime),
//                 subject: row.subject,
//                 teacher: row.teacher
//             };
//             scheduleData.push(formattedRow);
//         })
//         .on('end', async () => {
//             try {
//                 console.log(scheduleData);
//                 await prisma.schedule.createMany({
//                     data: scheduleData
//                 });
//                 console.log('Data successfully pushed to the database!');
//             } catch (error) {
//                 console.error('Error pushing data:', error);
//             } finally {
//                 await prisma.$disconnect();
//             }
//         });
// }

// // pushScheduleDataFromCSV();

// export {};