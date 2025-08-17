'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '../styles/HomePage.css';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import * as pdfjsLib from 'pdfjs-dist';
import { fileTypeFromBlob } from 'file-type';
import TableSkeleton from '../table-loading-skeleton';
// import heic2any from 'heic2any';
import { Student } from '@prisma/client';
import { AnimatePresence, easeInOut, motion } from 'framer-motion';
import Header from '../header';
import ConfirmationPopup from '../confirmation';
import { Skeleton } from "@/components/ui/skeleton"
import SkeletonTable from "@patternfly/react-component-groups/dist/dynamic/SkeletonTable";
import imageCompression from 'browser-image-compression';
import jsPDF from 'jspdf';
import { CldImage, getCldImageUrl } from 'next-cloudinary';
import ConvertApi from 'convertapi-js';
import { PDFDocument } from 'pdf-lib'
import PDFMerger from 'pdf-merger-js/browser';
import { deflateSync } from 'zlib';
import { resolve } from 'path/posix';
import { trackSynchronousPlatformIOAccessInDev } from 'next/dist/server/app-render/dynamic-rendering';
import { Dancing_Script, Playwrite_IT_Moderna } from 'next/font/google';
import { DateTime } from 'luxon';
import { get } from 'http';

const plwrtITModerna = Playwrite_IT_Moderna({
  variable: "--font-dancing-script"
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface StudentWithLetterStatus extends Student {
  letterstatus: number
};


const HomePage = () => {
  const [loadingMessage, setLoadingMessage] = useState<string>('Fetching response... Please wait');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorMessage2, setErrorMessage2] = useState<string>('');
  const [successMessage2, setSuccessMessage2] = useState<string>('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [students, setStudents] = useState<StudentWithLetterStatus[]>([]);
  const [receivedResponse, setReceivedResponse] = useState<boolean>(false);
  const [manuallyEntered, setManuallyEntered] = useState<boolean>(false);
  const [enteredSAPIDs, setEnteredSAPIDs] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<{ [key: number]: boolean }>({});
  const [noLetterSAPIDs, setNoLetterSAPIDs] = useState<string>('');
  const [noLetterStudents, setNoLetterStudents] = useState<StudentWithLetterStatus[]>([]);
  const [noLetterErrorMessage, setNoLetterErrorMessage] = useState<string>('');
  const [noLetterSuccessMessage, setNoLetterSuccessMessage] = useState<string>('');
  const [showNoLetterErrorMessageWithoutTable, setShowNoLetterErrorMessageWithoutTable] = useState<boolean>(true);
  const [reason, setReason] = useState<string>('');
  const [noLetterReason, setNoLetterReason] = useState<string>('');
  const [originallyExtractedDates, setOriginallyExtractedDates] = useState<Date[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [pastDates, setPastDates] = useState<Date[]>([]);
  const [farFutureDates, setFutureDates] = useState<Date[]>([]);
  const [safeToUpload, setSafeToUpload] = useState<boolean>(true);
  const [manuallyEnteredSAPIDs, setManuallyEnteredSAPIDs] = useState<StudentWithLetterStatus[]>([]);
  const [sizeLimitExceededMessage, setSizeLimitExceededMessage] = useState<string>('');
  const [mediaFilesLimitExceededMessage, setMediaFilesLimitExceededMessage] = useState<string>('');
  const [uploadedFileNamesToDisplay, setUploadedFileNamesToDisplay] = useState<string>('');
  const [noLetterFlipFlop, setNoLetterFlipFlop] = useState<boolean>(false);
  const [manualInputLetterFlipFlop, setManualInputLetterFlipFlop] = useState<boolean>(false);
  const [letterUploadFlipFlop, setLetterUploadFlipFlop] = useState<boolean>(false);
  const [plural, setPlural] = useState<string>('');
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [imagesUploadedToCloudinary, setImagesUploadedToCloudinary] = useState<string[]>([]);
  const [dateOfCacheUpdate, setDateOfCacheUpdate] = useState<Date | null>(new Date());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const prevStudentsLength = useRef<number>(0);
  const currStudentsLength = useRef<number>(0);
  const submittingWithLetter = useRef<boolean>(true);
  const router = useRouter();
  const FILE_SIZE_LIMIT_IN_MB = 5;
  const MEDIA_FILES_LIMIT = 10;

  useEffect(() => {
    if (students.length > 0) {
      const initialSelection: { [key: number]: boolean } = {};
      students.forEach(student => {
        initialSelection[Number(student.sapid)] = false;
      });
      setSelectedRows(initialSelection);
    }
  }, [students]);


  useEffect(() => {
    dates.forEach((date) => {
      // console.log('Hi', date, date.toISOString());
      date.setHours(5, 30, 0, 0);
      // console.log('Hi', date, date.toISOString());
    });
  }, [dates]);



  useEffect(() => {
    if (uploadedFiles) {
      setStudents([]);
      setReceivedResponse(false);
      setManuallyEntered(false);
    }
  }, [uploadedFiles]);


  useEffect(() => {
    let element: HTMLElement | null;
    if(showNoLetterErrorMessageWithoutTable)
    {
      element = document.getElementById('no-letter-error-without-table');
    }
    else
    {
      element = document.getElementById('no-letter-error-with-table');
    }
    if(element)
    {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, [noLetterErrorMessage, noLetterFlipFlop]);


  useEffect(() => {
    const element = document.getElementById('no-letter-success-message');
    if(element)
    {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, [noLetterSuccessMessage, noLetterFlipFlop]);


  useEffect(() => {
    const timeout = currStudentsLength.current > 0 ? 250 : 850;
    setTimeout(() => {
      const element = currStudentsLength.current > 0 ? document.getElementById('letter-table-div-container') : document.getElementById('letter-no-sap');
      if(element)
      {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, timeout);
  }, [letterUploadFlipFlop]);


  useEffect(() => {
    const element = document.getElementById('letter-success-error-message');
    if(element)
    {
      setTimeout(() => {
        let noOfNewlyAddedRows: number;
        let rowToShowFrom: string;
        if(prevStudentsLength.current > students.length)
        {
          noOfNewlyAddedRows = students.length - prevStudentsLength.current
          rowToShowFrom = `letter-row-${students.length - noOfNewlyAddedRows}`
        }
        else
        {
          rowToShowFrom = `letter-row-${students.length - 1}`
        }
        const elem = document.getElementById(rowToShowFrom);
        elem?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [manualInputLetterFlipFlop]);
  

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files) {
      if (files.length === 0) return;

      setErrorMessage('');
      setErrorMessage2('');
      setSizeLimitExceededMessage('');
      setMediaFilesLimitExceededMessage('');
      setSuccessMessage2('');
      setSelectedRows({});
      setReason('');
      setPlural('');
      setUploadedFiles([]);
      setUploadedFileNamesToDisplay('');
      setLoadingMessage('Uploading files...');
      setSafeToUpload(false);
      setImagesUploadedToCloudinary([]);
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'];
      
      const images: File[] = [];
      const pdfs: File[] = [];
      const allPDFsToImages: File[] = [];

      const ignoredFiles: File[] = []
      const namedFiles: File[] = [];
      
      
      let pluralstr = '';

      const heic2any = (await import('heic2any')).default;

      for(const file of Array.from(files))
      {
        if(file.type==='')
        {
          const actualFileTypeResponse = await fileTypeFromBlob(file);
          const actualFileType = actualFileTypeResponse?.mime;
          if(actualFileType === 'image/heic')
          {
            console.log('Converting HEIC to JPG...');
            setLoadingMessage('Converting HEIC to JPG...');
            const fileURL = URL.createObjectURL(file);
            const fileRes = await fetch(fileURL);
            const fileBlob = await fileRes.blob();
            let convertedFile: any = await heic2any({blob: fileBlob, toType: 'image/jpeg'});
            convertedFile.name = file.name;
            convertedFile.lastModifiedDate = new Date();
            console.log(convertedFile);
            const finalConvertedFile = new File([convertedFile], file.name, {type: 'image/jpeg', lastModified: Date.now()});
            console.log(finalConvertedFile)
            namedFiles.push(finalConvertedFile);
            images.push(finalConvertedFile);
          }
        }
        if(allowedTypes.includes(file.type) && file.size > FILE_SIZE_LIMIT_IN_MB * 1024 * 1024)
        {
          ignoredFiles.push(file);
        }
        else if(allowedTypes.includes(file.type) && file.type !== 'application/pdf')
        {
          images.push(file);
          namedFiles.push(file);
        }
        else if(allowedTypes.includes(file.type) && file.type === 'application/pdf')
        {
          namedFiles.push(file);
          pdfs.push(file);
        }
      }

      const pdfToImages: File[][] = await Promise.all(pdfs.map((pdf) => {
        return convertPdfToImage(pdf);
      }));

      pdfToImages.forEach((pdfImageList) => {
        allPDFsToImages.push(...pdfImageList);
      })

      setLoadingMessage('Fetching response... Please wait');

      console.log('Named Files', namedFiles);

      if(namedFiles.length > 1)
      {
        pluralstr = 's';
      }
      else
      {
        pluralstr = '';
      }
      
      setPlural(pluralstr);

      if(namedFiles.length > 0)
      {
        if(namedFiles.length === 1)
        {
          setUploadedFileNamesToDisplay(`${namedFiles[0].name}`);
        }
        else if(namedFiles.length === 2)
        {
          setUploadedFileNamesToDisplay(`\`${namedFiles[0].name}\` and \`${namedFiles[1].name}\``);
        }
        else
        {
          const file_or_files = (namedFiles.length - 2 > 1) ? 'files' : 'file';
          setUploadedFileNamesToDisplay(`\`${namedFiles[0].name}\`, \`${namedFiles[1].name}\` and ${namedFiles.length-2} other ${file_or_files}`);
        }
      }

      let validFiles = [...allPDFsToImages, ...images];

      if(validFiles.length === 0 && ignoredFiles.length === 0)
      {
        setLoadingMessage('');
        setSafeToUpload(true);
        setErrorMessage('Please upload a valid PDF, JPG, PNG or HEIC file.');
        return;
      }

      if(validFiles.length > MEDIA_FILES_LIMIT)
      {
        setMediaFilesLimitExceededMessage(`Sorry, due to memory constraints we can only allow uploads of upto ${MEDIA_FILES_LIMIT} images at once. The last ${validFiles.length - MEDIA_FILES_LIMIT} image${validFiles.length - MEDIA_FILES_LIMIT > 1 ? 's' : ''} will be discarded. 
          If all of these images are a part of a single letter and you really need to upload them, please try contacting the owner or attach a link to these files uploaded on a separate cloud storage in the reason section.`);
        validFiles = validFiles.slice(0, MEDIA_FILES_LIMIT);
      }


      const compressedImages: File[] = [];

      // console.log(validFiles);

      // for (let i = 0; i < validFiles.length; i++) {
      //   const image = validFiles[i];
      //   const compressedImage = await imageCompression(image, { maxSizeMB: 1 });
      //   compressedImages.push(new File([compressedImage], validFiles[i].name));
        // let orgSize = image.size, compSize = compressedImage.size;
        // console.log(`${image.name} Original Size: ${orgSize / 1024} KB Compressed Size: ${compSize / 1024} KB`);
      // }

      // await Promise.all(validFiles.map(async (image) => {
      //   const compressedImage = await imageCompression(image, { maxSizeMB: image.size / 1024 / 1024 / 2 });
      //   compressedImages.push(compressedImage);
      //   // compressedImages.push(new File([compressedImage], image.name));
      //   console.log(image.size/1024, compressedImage.size/1024)
      // }));

      console.log('Compressed Images', compressedImages);

      for(let j = 0; j < compressedImages.length; j++)
      {
        let orgSize = validFiles[j].size, compSize = compressedImages[j].size;
        console.log(`${validFiles[j].name} Original Size: ${orgSize / 1024} KB Compressed Size: ${compSize / 1024} KB`);
      }
      
      setSafeToUpload(false);
      setUploadedFiles(validFiles);
      setErrorMessage('');
      setErrorMessage2('');
      setSizeLimitExceededMessage('');
      setSuccessMessage2('');
      setSelectedRows({});
      setReason('');
      
      setStudents([]);
      setReceivedResponse(false);
      setManuallyEntered(false);
      
      // console.log('Here!', students, receivedResponse, manuallyEntered);

      console.log('Uploading files: ', validFiles);

      console.log(ignoredFiles);

      let fileURLs: string[] = []
        
      for(const file of Array.from(validFiles))
      {
        fileURLs.push(URL.createObjectURL(file));
      }

      setPreviewImages(fileURLs);
      
      console.log(ignoredFiles)

      if(ignoredFiles.length > 0)
      {
        if(ignoredFiles.length === 1)
        {
          setSizeLimitExceededMessage(`Ignored "${ignoredFiles[0].name}" as its size exceeded ${FILE_SIZE_LIMIT_IN_MB} MB`);
        }
        else if(ignoredFiles.length === 2)
        {
          setSizeLimitExceededMessage(`Ignored "${ignoredFiles[0].name}" and "${ignoredFiles[1].name}" as their size exceeded ${FILE_SIZE_LIMIT_IN_MB} MB`);
        }
        else
        {
          const file_or_files = (ignoredFiles.length - 2 > 1) ? 'files' : 'file';
          setSizeLimitExceededMessage(`Ignored "${ignoredFiles[0].name}", "${ignoredFiles[1].name}" and ${ignoredFiles.length-2} other ${file_or_files} as their size exceeded ${FILE_SIZE_LIMIT_IN_MB} MB`);
        }
      }
      
      if(validFiles.length === 0)
      {
        setSafeToUpload(true);
        return;
      }

      const formData = new FormData();

      formData.append('noOfImages', fileURLs.length.toString());

      async function blobToBase64(blob: Blob): Promise<string> {
        const reader = new FileReader();
        
        // Create a promise that will be resolved when the reader finishes
        const readPromise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = (error) => {
            reject(error);
          };
        });
      
        // Start reading the blob as a Data URL (Base64 string)
        reader.readAsDataURL(blob);
      
        // Wait for the reader to finish and return the result
        return await readPromise;
      }
      

      await Promise.all(
        validFiles.map(async (validFile, index) => {
          formData.append(`file-${index+1}`, validFile);
          const base64String = await blobToBase64(validFile);
          formData.append(`file-${index+1}-base64`, base64String);
        }
      ));

      try
      {
          const response = await fetch('/api/process-image', {
              method: 'POST',
              body: formData,
          });

          if(response.status !== 200)
          {
            setErrorMessage(`Error processing image`);
            setSafeToUpload(true);
            return;
          }
          
          try
          {
            const data = await response.json();
            setReceivedResponse(true);
            const sapid_list: Array<number> = data.list;
            const dates: Array<string> = data.dates;
            const reason: string = data.reason;
            console.log(sapid_list);
            console.log(dates);
            console.log(reason);
            setReason(reason);
            const datesOfThePast: Array<Date> = [];
            const datesWithinTwoMonthsFromNow: Array<Date> = [];
            const datesOfTheFarFuture: Array<Date> = [];
            dates.map((date) => {
              const theDate = new Date(date);
              if(!isNaN(theDate.getTime()))
              {
                // theDate.setHours(0, 0, 0, 0);
                const condition = checkIfDateWithinTwoMonthsFromToday(theDate);
                condition === 0 ? datesWithinTwoMonthsFromNow.push(theDate) : 
                condition === 1 ? datesOfTheFarFuture.push(theDate) : 
                datesOfThePast.push(theDate);
              }
            });
            datesOfThePast.sort((a: Date, b: Date) => a.getTime() - b.getTime());
            datesWithinTwoMonthsFromNow.sort((a: Date, b: Date) => a.getTime() - b.getTime());
            datesOfTheFarFuture.sort((a: Date, b: Date) => a.getTime() - b.getTime());
            console.log('Past', datesOfThePast);
            console.log('Near Present', datesWithinTwoMonthsFromNow);
            console.log('Far Future', datesOfTheFarFuture);
            setPastDates(datesOfThePast);
            setDates(datesWithinTwoMonthsFromNow);
            setOriginallyExtractedDates(datesWithinTwoMonthsFromNow);
            setFutureDates(datesOfTheFarFuture);
            if(Array.isArray(sapid_list))
            {
              console.log(sapid_list.length);
              if(sapid_list.length > 0)
              {
                setReceivedResponse(false);
                console.log('Extracted SAP IDs:', sapid_list);
                fetchStudentData(sapid_list, true);
              }
              else
              {
                currStudentsLength.current = 0;
                setLetterUploadFlipFlop((prev) => !prev);
                setErrorMessage(`Failed to extract valid SAP IDs from the image${pluralstr}.`);
              }
            }
            else
            {
              setErrorMessage(`Failed to extract text from the image${pluralstr}.`);
            }
          }
          catch (error)
          {
            console.log('Error parsing response:', error);
            setErrorMessage(`Failed to extract text from the image${pluralstr}.`);
          }
          finally
          {
            setSafeToUpload(true);
          }
      }
      catch (error)
      {
          console.log('Error processing image:', error);
          setErrorMessage('Error processing image.');
      }
      finally
      {
        setSafeToUpload(true);
        event.target.value = '';
      }
    }
  };

  const checkIfDateWithinTwoMonthsFromToday = (date: Date) : number => {
    const normalizedToday: Date = new Date();
    const normalizedThatDay: Date = new Date(date);
    const normalizedTwoMonthsFromNow: Date = new Date();

    normalizedTwoMonthsFromNow.setDate(normalizedToday.getDate() + 30 * 2);
    normalizedToday.setHours(0, 0, 0, 0);
    normalizedThatDay.setHours(0, 0, 0, 0);
    normalizedTwoMonthsFromNow.setHours(0, 0, 0, 0);

    if(normalizedThatDay < normalizedToday)
    {
      return -1; // past
    }
    else if(normalizedThatDay < normalizedTwoMonthsFromNow)
    {
      return 0; // within two months from today
    }
    else
    {
      return 1; // more than two months into the future
    }
  }


  const convertPdfToImage = async (pdfFile: File): Promise<File[]> => {

    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(pdfFile)).promise;
    const filename = pdfFile.name;
    const noOfPages = pdf.numPages;

    const pdfPagesAsImages: File[] = [];

    setLoadingMessage('Converting PDF to images');

    for(let pageNumber = 1; pageNumber <= noOfPages; pageNumber++)
    {
      const page: pdfjsLib.PDFPageProxy = await pdf.getPage(pageNumber);
      const canvas: HTMLCanvasElement = document.createElement('canvas');
      
      const context = canvas.getContext('2d');
      const viewport = page.getViewport({scale: 1.5});
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if(context)
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
            if (result) {
                resolve(result);
            } else {
                reject(new Error('Failed to create blob from canvas'));
            }
        }, 'image/png');
      });
      
      const image = new File([blob], `${filename}-image-${pageNumber}`, {type: 'image/png'});
      pdfPagesAsImages.push(image);
    }

    return pdfPagesAsImages;
  };

  const fetchStudentData = async (sapid_list: Array<number>, isnew: boolean = false, manual: boolean = false) => {
    try
    {
      prevStudentsLength.current = students.length;
      const original_length = sapid_list.length;
      sapid_list = [...new Set(sapid_list)];

      const response = await fetch('/api/get-students', 
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ sapid_list })
        }
      );

      if(response.status !== 200)
      {
        if(manual)
        {
          setErrorMessage2(`Error fetching student data.`);
        }
        else
        {
          setErrorMessage(`Error fetching student data.`);
        }
        setSafeToUpload(true);
        return;
      }

      const result = await response.json();

      if(manual)
      {
        let temp = manuallyEnteredSAPIDs;
        temp.push(...result.students);
        setManuallyEnteredSAPIDs(temp);
      }

      if((isnew || students.length === 0) && response.ok && !manual)
      {
        setReceivedResponse(true);
        setStudents(result.students);
        currStudentsLength.current = result.students.length;
        console.log(result.students);
      }
      else if((isnew || students.length === 0) && response.ok)
      {
        setReceivedResponse(true);
        result.students.forEach((student: any, index: number, arr: any[]) => {
          arr[index].letterstatus = 1;
        })
        if(result.students.length === 0)
        {
          setErrorMessage2('Couldn\'t find any records for any of the entered SAP IDs.');
        }
        setStudents(result.students);
        currStudentsLength.current = result.students.length;
        console.log(result.students);
      }
      else if(response.ok)
      {
        setReceivedResponse(true);
        console.log(result.students);
        if(result.students.length === 0)
        {
          setErrorMessage2('Couldn\'t find any records for any of the entered SAP IDs.');
        }
        if(original_length!==sapid_list.length)
        {
          setErrorMessage2('Ignored one or more records that were repetitive.');
        }
        const ideal_length = students.length + result.students.length;
        let updatedStudents = [...students];
        let count = 0;
        for(let studentObject of result.students)
        {
          if(!students.some(existingStudent => existingStudent.sapid === studentObject.sapid))
          {
            studentObject.letterstatus = 1;
            updatedStudents.push(studentObject);
            count = count + 1;
          }
        }
        if(ideal_length!==updatedStudents.length)
        {
          setErrorMessage2('Ignored one or more records that were repetitive.');
        }
        if(count > 0)
        {
          setSuccessMessage2(`Added ${count} row${count > 1 ? 's' : ''}.`);
        }
        setStudents(updatedStudents);
        currStudentsLength.current = updatedStudents.length;
      }
      else
      {
        console.log(result.error);
        setErrorMessage('Failed to fetch student data.');
      }
    }
    catch(error)
    {
      console.log('Error fetching student data:', error);
      manual ? setErrorMessage2('Error fetching student data.') : setErrorMessage('Error fetching student data.');
    }
    finally
    {
      if(!manual)
      {
        setLetterUploadFlipFlop((prev) => !prev);
      }
      setSafeToUpload(true);
    }
  }

  // const fetchNoLetterStudents = async (event: React.FormEvent) => {
  //   event?.preventDefault();
  //   setNoLetterFlipFlop((prev) => !prev);
  //   setNoLetterErrorMessage('');
  //   setNoLetterSuccessMessage('');
  //   console.log(noLetterSAPIDs);
  //   const noLetterSAPIDArray = noLetterSAPIDs.match(/[0-9]{11}/g)?.map((id) => parseInt(id, 10)) || [];
  //   const noLetterSet = [...new Set(noLetterSAPIDArray)];

  //   if(noLetterSet.length === 0)
  //   {
  //     setShowNoLetterErrorMessageWithoutTable(true);
  //     setNoLetterErrorMessage('No valid SAP IDs were entered.');
  //     if(noLetterStudents.length > 0)
  //     {
  //       setShowNoLetterErrorMessageWithoutTable(false);
  //     }
  //     return;
  //   }

  //   const response = await fetch('/api/get-students', 
  //     {
  //       method: 'POST',
  //       headers: {'Content-Type': 'application/json'},
  //       body: JSON.stringify({ sapid_list: noLetterSet })
  //     }
  //   );

  //   if(response.status !== 200)
  //   {
  //     setNoLetterErrorMessage(`Error fetching student data.`);
  //     return;
  //   }

  //   const result = await response.json();

  //   if(!response.ok)
  //   {
  //     return;
  //   }

  //   if(result.students.length === 0)
  //   {
  //     setShowNoLetterErrorMessageWithoutTable(true);
  //     setNoLetterErrorMessage('Couldn\'t find any records for any of the entered SAP IDs.');
  //   }

  //   result.students.forEach((student: any, index: number, arr: any[]) => {
  //     student.letterstatus = 3;
  //   });

  //   const ideal_length = noLetterStudents.length + result.students.length;
  //   let updatedStudents = [...noLetterStudents];
  //   let count = 0;
  //   for(let studentObject of result.students)
  //   {
  //     if(!noLetterStudents.some(existingStudent => existingStudent.sapid === studentObject.sapid))
  //     {
  //       updatedStudents.push(studentObject);
  //       count = count + 1;
  //     }
  //   }
  //   setNoLetterStudents(updatedStudents);
  //   if(ideal_length!==updatedStudents.length)
  //   {
  //     setShowNoLetterErrorMessageWithoutTable(false);
  //     setNoLetterErrorMessage('Ignored one or more records that were repetitive.');
  //   }
  //   if(count > 0)
  //   {
  //     setNoLetterSuccessMessage(`Added ${count} row${count > 1 ? 's' : ''}.`);
  //   }
  //   if(noLetterStudents.length > 0)
  //   {
  //     setShowNoLetterErrorMessageWithoutTable(false);
  //   }
  // }


  const handleManualInputSubmit = async (event: React.FormEvent) => {
    event?.preventDefault();
    setManualInputLetterFlipFlop((prev) => !prev);
    const enteredSAPIDArray = enteredSAPIDs.match(/[0-9]{11}/g)?.map((id) => parseInt(id, 10));
    console.log(enteredSAPIDArray)
    if(enteredSAPIDArray)
    {
      fetchStudentData(enteredSAPIDArray, false, true);
      setErrorMessage2('');
      setSuccessMessage2('');
    }
    else
    {
      setSuccessMessage2('');
      setErrorMessage2('No valid SAP IDs were entered.');
    }
    setManuallyEntered(true);
    setEnteredSAPIDs('');
  }

  const handleButtonClick = () => {
    if(fileInputRef.current) {
        fileInputRef.current.click();
    }
  };


  const toggleSelection = (sapid: number) => {
    setSelectedRows(prev => ({ ...prev, [sapid]: !prev[sapid] }));
  };

  const selectOrDeselectAll = () => {
    const allSelected = Object.values(selectedRows).every(val => val);
    const newSelection = Object.fromEntries(students.map(student => [student.sapid, !allSelected]));
    setSelectedRows(newSelection);
  };

  const invertSelection = () => {
    const flippedSelection: Record<number, boolean> = Object.keys(selectedRows).reduce((accumulator, key) => {
      accumulator[Number(key)] = !selectedRows[Number(key)];
      return accumulator;
    }, {} as Record<number, boolean>);
    setSelectedRows(flippedSelection);
  };

  // const removeRow = (sapid: number) => {
  //   if(noLetterStudents.length === 1)
  //   {
  //     setNoLetterErrorMessage('');
  //     setNoLetterSuccessMessage('');
  //   }
  //   setNoLetterStudents(prev => ( prev?.filter((item) => Number(item.sapid)!==sapid) ));
  // }

  // const removeAll = () => {
  //   setNoLetterStudents([]);
  //   setNoLetterErrorMessage('');
  //   setNoLetterSuccessMessage('');
  // }

  const getManuallyEnteredDates = (): Date[] => {
    dates.forEach((date) => {
      date.setHours(5, 30, 0, 0);
    });
    
    dates.sort((a: Date, b: Date) => a.getTime() - b.getTime());
    
    const manuallyEnteredDates = dates.filter(date => 
      !originallyExtractedDates.some(extractedDate => 
          new Date(date).getTime() === new Date(extractedDate).getTime()
      )
    );
    
    return manuallyEnteredDates;
  }

  const getSelectedOriginallyExtractedDates = (): Date[] => {
    originallyExtractedDates.forEach((date) => {
      date.setHours(5, 30, 0, 0);
    })

    dates.forEach((date) => {
      date.setHours(5, 30, 0, 0);
    });

    const originallyExtractedTimestamps: Set<number> = new Set(
      originallyExtractedDates.map(date => date.getTime())
    );

    const selectedOriginallyExtractedDates: Date[] = dates.filter(date =>
      originallyExtractedTimestamps.has(date.getTime())
    );

    return selectedOriginallyExtractedDates;
  }

  const checkIfImageExists = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    }
    catch {
      return false;
    }
  }

  const getISTNoon = (pureDateString: string): DateTime => {
    return DateTime.fromISO(pureDateString, { zone: 'Asia/Kolkata' }).set({
      hour: 12,
      minute: 0,
      second: 0,
      millisecond: 0
    });
  }


  const handleSubmit = async (force_reupload: boolean = false): Promise<number> => {
    const currDate = (new Date());
    if(!force_reupload)
    {
      console.log('Date of cache update', dateOfCacheUpdate);
      if(dateOfCacheUpdate !== null)
      {
        console.log('Checking dates');
        console.log(dateOfCacheUpdate.getDate(), currDate.getDate());
        if(dateOfCacheUpdate.getDate() !== currDate.getDate() || 
          dateOfCacheUpdate.getMonth() !== currDate.getMonth() || 
          dateOfCacheUpdate.getFullYear() !== currDate.getFullYear())
        {
          console.log('Mismatch');
          return handleSubmit(true);
        }
      }
    }

    setDateOfCacheUpdate(currDate);

    const selectedSAPIDs = students.filter(student => selectedRows[Number(student.sapid)]);

    dates.sort((a: Date, b: Date) => a.getTime() - b.getTime());

    const manuallyEnteredDates = getManuallyEnteredDates();

    console.log('Originally extracted dates: ', originallyExtractedDates)
    console.log('All dates: ', dates)
    console.log('Manually entered dates: ', manuallyEnteredDates)

    console.log('Submitting SAP IDs:', selectedSAPIDs, 'Reason:', reason, 'Dates:', dates);
    //
    try
    {
      let imageLinks: string[];

      if(imagesUploadedToCloudinary.length === 0 || force_reupload)
      {
        const NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
        const promises = uploadedFiles.map(async (image) => {
          const formData = new FormData();
          formData.append('file', image);
          formData.append('upload_preset', 'AttendanceManager');
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
              method: 'POST',
              body: formData
            }
          );
          const link = await response.json();
          console.log('Link', link);
          return link.url;
        });
  
        imageLinks = await Promise.all(promises);
      }
      else
      {
        imageLinks = imagesUploadedToCloudinary;
      }

      const ISTNoonAllDates: Date[] = dates.map((date) => {
        return getISTNoon(date.toISOString().split('T')[0]).toJSDate();
      });

      const ISTNoonManuallyEnteredDates: Date[] = manuallyEnteredDates.map((date) => {
        return getISTNoon(date.toISOString().split('T')[0]).toJSDate();
      });

      console.log('IST Noon DateTimes:', ISTNoonAllDates);
      console.log('IST Noon DateTimes:', ISTNoonManuallyEnteredDates);

      const attendance_response = await fetch('/api/post-attendance', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentDetails: selectedSAPIDs,
          letterDetails: {imageLinks: imageLinks, reason: reason},
          attendanceDates: ISTNoonAllDates,
          manuallyEnteredDates: ISTNoonManuallyEnteredDates
        })
      });

      console.log(attendance_response);

      if(!force_reupload && imagesUploadedToCloudinary.length!==0 && attendance_response.status===200)
      {
        console.log('Checking if cached images still exist...');
  
        const imageExistsPrmoises: Promise<boolean>[] = imageLinks.map(async (image) => {
          return checkIfImageExists(image);
        });

        const imageExists = await Promise.all(imageExistsPrmoises);
  
        const allImagesExist = imageExists.reduce((acc, curr) => (acc && curr), true);
  
        console.log('All Images Exist?', allImagesExist);
  
        if(!allImagesExist)
        {
          const forced_reupload_attendance_response = await handleSubmit(true);
          return forced_reupload_attendance_response;
        }
      }

      setImagesUploadedToCloudinary(imageLinks);

      return attendance_response.status;
    }
    catch (error)
    {
      console.log(`Error sending student data: ${error}`);
      return -1;
    }
  };

  // const handleSubmitNoLetter = async (): Promise<number> => {
  //   try
  //   {
  //     noLetterDates.forEach((date: Date) => {
  //       date.setHours(5, 30, 0, 0);
  //     });

  //     const attendance_response = await fetch('/api/post-attendance-without-letters', {
  //       method: 'POST',
  //       headers: {"Content-Type": "application/json"},
  //       body: JSON.stringify({
  //         studentDetails: noLetterStudents,
  //         letterDetails: {reason: noLetterReason},
  //         attendanceDates: noLetterDates
  //       })
  //     });

  //     console.log(attendance_response);

  //     return attendance_response.status;
  //   }
  //   catch (error)
  //   {
  //     console.log(`Error sending student data: ${error}`);
  //     return -1;
  //   }
  // }

  const goToSAPIDEntering = () => {
    // if(typeof window === 'undefined') return;
    const element = document.getElementById('enter-sap-ids');
    if(element) {
      const elementRect = element.getBoundingClientRect();
      const offset = window.innerHeight * 0.3 - elementRect.height / 2;

      window.scrollTo({
        top: window.scrollY + elementRect.top - offset,
        behavior: 'smooth'
      });

      setTimeout(() => {
        element.classList.add('highlighted');
        setTimeout(() => {
          element.classList.remove('highlighted');
        }, 1200);
      }, 500);
    }
  }

  const formattedDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  const twoMonthsFromNow = new Date();
  twoMonthsFromNow.setDate(twoMonthsFromNow.getDate() + 30 * 2);


  return (
    <div className='homepage'>
      <div className='top-container'>
        {/* <div className='title-button-side-by-side'>
          <h1 className='home-page title'>CHARM</h1>
          <button className='btn view-requests-button' onClick={() => router.push('/teacher-view')}>
              View requests as a teacher
          </button>
        </div> */}
        {/* <Header></Header> */}
        <h1 className={`home-page title ${dancingScript.className}`}>CHARM</h1>
        <h1 className={`home-page title-desc ${plwrtITModerna.className}`}>Centralized Home for Attendance Request Management</h1>
      </div>
      <br/>
      {/* <strong><h1 className='home-page'>Make a request with a letter</h1></strong> */}
      <h1 className='home-page'>Make a request with a letter</h1>
      <p className='home-page description'>
        Upload an image / PDF of your letter to send along with the request. Multiple pages for the same letter can be uploaded together, select as many files as necessary.
      </p>
      <div className='upload-section'>
        <input type='file' multiple ref={fileInputRef} style={{display: 'none'}} onChange={handleFileUpload} />
        {
          safeToUpload ?
          <button className='btn upload-button' disabled={!safeToUpload} style={safeToUpload ? {} : {backgroundColor: 'grey'}} onClick={handleButtonClick}>
            Upload Images/PDF of the Letter
          </button> :
          <>
            <b><h1 className='home-page loading-text'>{loadingMessage}</h1></b>
            <br></br>
          </>
        }
        {uploadedFiles.length !==0 && <p className='home-page'><b>Uploaded File{plural}:</b> {uploadedFileNamesToDisplay}</p>} {/* */}
      </div>
      {errorMessage && <p className='home-page error'>{errorMessage}</p>}
      {sizeLimitExceededMessage && <p className='home-page size-limit-exceeded'>{sizeLimitExceededMessage}</p>}
      {mediaFilesLimitExceededMessage && <p className='home-page media-files-limit-exceeded'>{mediaFilesLimitExceededMessage}</p>}
      {uploadedFiles?.length !== 0 && (
        <div className='preview-section-container'>
          <div className='preview-section'>
            {previewImages.map((imgLink) => (
              <img key={imgLink} src={imgLink} className='preview-img' alt='Image Preview' />
            ))}
          </div>
        </div>
      )}

      {
        !safeToUpload ? 
        <>
          {/* <div className='table-skeleton-container'>
            <br></br>
            <br></br>
            <TableSkeleton />
          </div> */}
        </>
        : 
        <AnimatePresence>
          {
            (!(students.length === 0 && !receivedResponse) &&
            <motion.div 
              id="table-animated-root-container"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >  
              {(students.length > 0 ?
                <div className='table-div-container' id='letter-table-div-container'>
                    <div className='main-table-info'>
                      <h1 className='home-page main-table-info-text'>Scroll horizontally to view all the details</h1>
                      <h1 className='home-page main-table-info-text'>Click on a row to select it</h1>
                      <div className='two-button-container'>
                        <button className='select-all-btn' onClick={selectOrDeselectAll}>{Object.values(selectedRows).every(val => val) ? 'Deselect All' : 'Select All'}</button>
                        <button className='invert-selection-btn' onClick={invertSelection}>Invert Selection</button>
                      </div>
                    </div>
                    {
                      (manuallyEnteredSAPIDs.length > 0) ?
                      <b><h1 className='home-page table-title'>Retrieved/Added Names</h1></b> :
                      <b><h1 className='home-page table-title'>Retrieved Names</h1></b>
                    }
                    <div className='table-div'>
                        <table className='main-table' id='letter-table'>
                          <thead>
                            <tr>
                              <th className='sapid'>SAP ID</th>
                              <th>Name</th>
                              <th>Roll No</th>
                              <th>Batch</th>
                              <th>
                                Select Rows
                              </th>
                            </tr>
                          </thead>
                          <AnimatePresence>
                            <tbody>
                              {
                                students.map((student, index) => (
                                  <motion.tr onClick={() => toggleSelection(Number(student.sapid))} className='clickable' id={`letter-row-${index}`} key={student.sapid} style={{ backgroundColor: selectedRows[Number(student.sapid)] ? '#c3e6cb' : 'white' }}
                                    initial={{ opacity: 0, scale: 1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                  >
                                    <td>{student.sapid}</td>
                                    <td>{student.name}</td>
                                    <td>{student.rollno}</td>
                                    <td>{student.batchid}</td>
                                    <td className='row-bt' style={selectedRows[Number(student.sapid)] ? {color: 'green'} : {}}>
                                      {selectedRows[Number(student.sapid)] ? '✔' : 'Click to Select'}
                                    </td>
                                  </motion.tr>
                                ))
                              }
                            </tbody>
                          </AnimatePresence>
                        </table>
                    </div>
                    <div id='letter-success-error-message'>
                      {successMessage2 && <p className='home-page success'>{successMessage2}</p>}
                      {errorMessage2 && <p className='home-page error'>{errorMessage2}</p>}
                    </div>
                    <div id='select-add-info'>
                      <p className='home-page'>Select all the rows you wanna submit for the request</p>
                        <div id='add-sap-ids-redirector' onClick={() => {goToSAPIDEntering()}}>
                          <p className='home-page'>If your name is in the letter and you don't find it in the table</p>
                          <p className='home-page'>Click here to add it manually</p>
                        </div>
                    </div>
                </div> :
                <div className='notfound' id='letter-no-sap'>
                  <h1 className='home-page'>Sorry, we could not retrieve any valid student details from the given image{plural}</h1>
                  <div id='letter-success-error-message'>
                      {errorMessage2 && <p className='home-page error'>{errorMessage2}</p>}
                  </div>
                </div>
              )}
            </motion.div>)
          }
        </AnimatePresence>
      }
      

      <AnimatePresence>
        {!(students.length === 0 && !receivedResponse) && Object.values(selectedRows).some(val => val) && (
          <motion.div 
            id="reason-date-animated-root-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className='reason-date-container-container'>
              {/* <br></br> */}
              <div className='reason-date-container grid grid-cols-[1fr_2.5fr] w-1/2 place-content-center'>
                <label>Enter the reason:</label>
                <input type='text' className='enter-reason' placeholder='Enter Reason' value={reason} onChange={e => setReason(e.target.value)} />
                <label>Pick attendance dates:</label>
                <Flatpickr
                  options={{
                    mode: 'multiple',
                    minDate: 'today',
                    maxDate: twoMonthsFromNow,
                    animate: true
                    // formatDate: 
                  }}
                  className='calendar-date-picker'
                  // placeholder='Upto two months into the future...'
                  placeholder='Within next 2 months...'
                  value={dates}
                  onChange={setDates}
                />
                {/* <br/> */}
              </div>
              <button className='btn final-submit' onClick={() => {submittingWithLetter.current = true; setIsPopupOpen(true);}} disabled={!reason.trim() || dates.length === 0} style={(!reason.trim() || dates.length === 0) ? {backgroundColor: 'grey', cursor: 'default'} : {}}>Submit all selected rows</button>
              {isPopupOpen && submittingWithLetter.current && <ConfirmationPopup isPopupOpen={isPopupOpen} closePopup={() =>  setIsPopupOpen(false)} letter={submittingWithLetter.current} studentsExtractedFromLetter={students.filter((student) => (selectedRows[Number(student.sapid)] && student.letterstatus===0))} studentsManuallyAddedWithLetter={students.filter((student) => (selectedRows[Number(student.sapid)] && student.letterstatus===1))} extractedDates={getSelectedOriginallyExtractedDates()} manuallyAddedDates={getManuallyEnteredDates()} submitFunction={handleSubmit} />}
            </div>
            {pastDates.length !== 0 ? 
            <div>
              <br></br>
              <p className='home-page past-dates'>
                Date{pastDates.length > 1 ? 's' : ''} {pastDates.map((date: Date) => formattedDate(date)).join(', ')} extracted from the letter {pastDates.length > 1 ? 'are' : 'is'} of the past now and can no longer be requested for
              </p>
            </div> : <></>}
            {farFutureDates.length !== 0 ? 
            <div>
              <br></br>
              <p className='home-page far-future-dates'>
                Date{farFutureDates.length > 1 ? 's' : ''} {farFutureDates.map((date: Date) => formattedDate(date)).join(', ')} extracted from the letter {farFutureDates.length > 1 ? 'are' : 'is'} more than 2 months into the future from today and can't be requested for now
              </p>
            </div> : <></>}
          </motion.div>
        )}
      </AnimatePresence>

      {!(students.length === 0 && !receivedResponse) &&
        (
          <div className='sapid-entering' id='enter-sap-ids'>
            {/* <br></br> */}
            {/* {successMessage2 && errorMessage2 && <br></br>} */}
            <h1 className='home-page'>Can't find your name in the list?</h1>
            <h1 className='home-page'>Enter it manually!</h1>
            <p className='home-page extra-addition'>If the OCR model couldn't detect your SAP ID from the image, you can enter one or more SAP IDs (separated by a whitespace) below to add them to the list.</p>
            {/* <br></br> */}
            <form className='sapid-form' onSubmit={handleManualInputSubmit}>
              <input
                type='text'
                id='extra-enter'
                className='sapid-input'
                placeholder='Enter SAP IDs (space separated)'
                value={enteredSAPIDs}
                onChange={(e) => setEnteredSAPIDs(e.target.value)}
              />
              <button className='btn add-extra-sapids' type='submit'>Add SAP ID(s)</button>
            </form>
          </div>
        )
      }
    </div>
  );
};

export default HomePage;