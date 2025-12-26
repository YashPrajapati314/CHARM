'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '@/app/styles/HomePage.css';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import * as pdfjsLib from 'pdfjs-dist';
import { fileTypeFromBlob } from 'file-type';
import TableSkeleton from '../table-loading-skeleton';
// import heic2any from 'heic2any';
import { Student } from '@prisma/client';
import { AnimatePresence, easeInOut, motion } from 'framer-motion';
import ConfirmationPopup from '@/app/confirmation';
import sucrose_clipboard from '@/images/webp/sucrose-clipboard.webp'
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
import { useSession } from 'next-auth/react';

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


const RequestWithoutLetterPage = () => {
  const { data: session, status } = useSession();
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
  const [noLetterReason, setNoLetterReason] = useState<string>('');
  const [originallyExtractedDates, setOriginallyExtractedDates] = useState<Date[]>([]);
  // const [dates, setDates] = useState<Date[]>([]);
  const [noLetterDates, setNoLetterDates] = useState<Date[]>([]);
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
    noLetterDates.forEach((date) => {
      date.setHours(5, 30, 0, 0)
    });
  }, [noLetterDates])


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


  const fetchNoLetterStudents = async (event: React.FormEvent) => {
    event?.preventDefault();
    setNoLetterFlipFlop((prev) => !prev);
    setNoLetterErrorMessage('');
    setNoLetterSuccessMessage('');
    console.log(noLetterSAPIDs);
    const noLetterSAPIDArray = noLetterSAPIDs.match(/[0-9]{11}/g)?.map((id) => parseInt(id, 10)) || [];
    const noLetterSet = [...new Set(noLetterSAPIDArray)];

    if(noLetterSet.length === 0)
    {
      setShowNoLetterErrorMessageWithoutTable(true);
      setNoLetterErrorMessage('No valid SAP IDs were entered.');
      if(noLetterStudents.length > 0)
      {
        setShowNoLetterErrorMessageWithoutTable(false);
      }
      return;
    }

    const params = new URLSearchParams();

    noLetterSet.forEach((sapid) => {
      params.append('sapid', String(sapid));
    });
    
    let tempResponse = await fetch(`/api/students?${params.toString()}`, {
      method: 'GET'
    });

    if (tempResponse.status === 431) {
      console.log('Request Header too large for GET, trying POST request instead');

      tempResponse = await fetch('/api/students', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ sapid_list: noLetterSet })
      });
    }
    
    const response = tempResponse;

    if(response.status !== 200)
    {
      setNoLetterErrorMessage(`Error fetching student data.`);
      return;
    }

    const result = await response.json();

    if(!response.ok)
    {
      return;
    }

    if(result.students.length === 0)
    {
      setShowNoLetterErrorMessageWithoutTable(true);
      setNoLetterErrorMessage('Couldn\'t find any records for any of the entered SAP IDs.');
    }

    result.students.forEach((student: any, index: number, arr: any[]) => {
      student.letterstatus = 3;
    });

    const ideal_length = noLetterStudents.length + result.students.length;
    let updatedStudents = [...noLetterStudents];
    let count = 0;
    for(let studentObject of result.students)
    {
      if(!noLetterStudents.some(existingStudent => existingStudent.sapid === studentObject.sapid))
      {
        updatedStudents.push(studentObject);
        count = count + 1;
      }
    }
    setNoLetterStudents(updatedStudents);
    if(ideal_length!==updatedStudents.length)
    {
      setShowNoLetterErrorMessageWithoutTable(false);
      setNoLetterErrorMessage('Ignored one or more records that were repetitive.');
    }
    if(count > 0)
    {
      setNoLetterSuccessMessage(`Added ${count} row${count > 1 ? 's' : ''}.`);
    }
    if(noLetterStudents.length > 0)
    {
      setShowNoLetterErrorMessageWithoutTable(false);
    }
  }

  const removeRow = (sapid: number) => {
    if(noLetterStudents.length === 1)
    {
      setNoLetterErrorMessage('');
      setNoLetterSuccessMessage('');
    }
    setNoLetterStudents(prev => ( prev?.filter((item) => Number(item.sapid)!==sapid) ));
  }

  const removeAll = () => {
    setNoLetterStudents([]);
    setNoLetterErrorMessage('');
    setNoLetterSuccessMessage('');
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

  const handleSubmitNoLetter = async (): Promise<number> => {
    try
    {
      noLetterDates.forEach((date: Date) => {
        date.setHours(5, 30, 0, 0);
      });

      const ISTNoonNoLetterDates: Date[] = noLetterDates.map((noLetterDate) => {
        return getISTNoon(noLetterDate.toISOString().split('T')[0]).toJSDate();
      });

      const noLetterReasonTrimmed = noLetterReason.trim();

      const truncatedReason: string = noLetterReasonTrimmed.length > 256 ? noLetterReasonTrimmed.slice(0, 256) + '...' : noLetterReasonTrimmed;
      
      const attendance_response = await fetch('/api/attendance-requests', {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          hasLetters: false,
          studentDetails: noLetterStudents,
          letterDetails: {
            imageLinks: process.env.NO_LETTER_MEDIA_LINK ? [process.env.NO_LETTER_MEDIA_LINK] : [],
            reason: truncatedReason
          },
          attendanceDates: ISTNoonNoLetterDates,
          uploaderId: session?.user.universityid
        })
      });

      console.log(attendance_response);

      return attendance_response.status;
    }
    catch (error)
    {
      console.log(`Error sending student data: ${error}`);
      return -1;
    }
  }

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

  if (status === 'loading') {
    <div className="loader-div">
      <div className="loader"></div>
    </div>
  }
  else if (session) {
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
        {safeToUpload && (<div className='no-letter' id='no-letter-div'>
          <h1 className='home-page'>Make a request without a letter</h1>
          <p className='home-page description'>
            If you don't have a letter available for the day and can't attend for a genuine reason,
            you can make a letterless request.
            Only go for this option if you have talked to the teachers about it before and they have agreed to mark
            you present without a letter being needed.
          </p>
            <AnimatePresence>
              {safeToUpload && (<div>
                {noLetterStudents.length!==0 && (
                  <motion.div className='table-div-container'
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <h1 className='home-page main-table-info-text'>Scroll horizontally to view all the details</h1>
                    <h1 className='home-page main-table-info-text'>Click on the last cell ✘ of a row to remove it</h1>
                    <b><h1 className='home-page table-title-no-letter'>Names (Without Letter)</h1></b>
                    <div className='table-div'>
                      <table className='main-table-no-letter'>
                        <thead>
                          <tr>
                            <th className='redth'>SAP ID</th>
                            <th className='redth'>Name</th>
                            <th className='redth'>Roll No</th>
                            <th className='redth'>Batch</th>
                            <th className='redth'>
                              Remove Rows
                              <br></br>
                            </th>
                          </tr>
                        </thead>
                          <tbody>
                            {
                            <AnimatePresence>
                              {noLetterStudents.map((student) => (
                                <motion.tr key={student.sapid}
                                  initial={{ opacity: 0, scale: 1 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 1 }}
                                  transition={{ duration: 0.25, ease: "easeInOut" }}
                                >
                                  <td className='redtd'>{student.sapid}</td>
                                  <td className='redtd'>{student.name}</td>
                                  <td className='redtd'>{student.rollno}</td>
                                  <td className='redtd'>{student.batchid}</td>
                                  <td onClick={() => removeRow(Number(student.sapid))} className='row-bt redtd' style={{color: 'red'}}>
                                    ✘
                                  </td>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                            }
                          </tbody>
                      </table>
                    </div>
                    <div>
                      <button className='remove-all-btn' onClick={removeAll}>Remove All</button>
                      {noLetterSuccessMessage && <p className='home-page no-letter-success' id='no-letter-success-message'>{noLetterSuccessMessage}</p>}
                      {noLetterErrorMessage && !showNoLetterErrorMessageWithoutTable && <p className='home-page no-letter-error' id='no-letter-error-with-table'>{noLetterErrorMessage}</p>}
                    </div>
                  </motion.div>
                )}
                <form className='sapid-form' onSubmit={fetchNoLetterStudents}>
                  <input
                    type='text'
                    id='no-letter-enter'
                    className='sapid-input'
                    placeholder='Enter SAP IDs (space separated)'
                    value={noLetterSAPIDs}
                    onChange={(e) => setNoLetterSAPIDs(e.target.value)}
                  />
                  <button className='btn add-extra-sapids' type='submit'>Add SAP ID(s)</button>
                </form>
                {noLetterErrorMessage && showNoLetterErrorMessageWithoutTable && <p className='home-page no-letter-error' id='no-letter-error-without-table'>{noLetterErrorMessage}</p>}
                  {noLetterStudents.length!==0 && 
                    <motion.div className='reason-date-container-container'
                      initial={{ opacity: 0, scale: 1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className='reason-date-container grid grid-cols-[1fr_2.5fr] w-1/2 place-content-center'>
                        <label>Enter the reason:</label>
                        <input type='text' className='enter-reason' placeholder='Enter Reason' value={noLetterReason} onChange={e => setNoLetterReason(e.target.value)} />
                        {/* <br/> */}
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
                          value={noLetterDates}
                          onChange={setNoLetterDates}
                        />
                        {/* <br/> */}
                      </div>
                      <button className='btn final-submit' onClick={() => {submittingWithLetter.current = false; setIsPopupOpen(true)}} disabled={!noLetterReason.trim() || noLetterDates.length === 0} style={(!noLetterReason.trim() || noLetterDates.length === 0) ? {backgroundColor: 'grey', cursor: 'default'} : {}}>Submit all letterless rows</button>
                      {isPopupOpen && !submittingWithLetter.current && <ConfirmationPopup isPopupOpen={isPopupOpen} closePopup={() =>  setIsPopupOpen(false)} letter={submittingWithLetter.current} noLetterStudents={noLetterStudents} noLetterDates={noLetterDates} submitFunction={handleSubmitNoLetter} />}
                    </motion.div>
                  }
              </div>)}
            </AnimatePresence>
        </div>)}
      </div>
    );
  }
  else {
    return (
      <>
        <div className="text-center">
          <h1 className={`home-page title ${dancingScript.className}`}>CHARM</h1>
        </div>
        <div className="m-2 flex flex-col gap-4">
          <div className="p-2 justify-center text-center text-lg">
            You aren't signed in! <br />
            <div className="justify-center text-center text-lg">
              Please <a href="/sign-in" className="text-blue-600 visited:text-blue-600">sign in</a> to continue
            </div>
            <br />
            <div className='flex flex-col justify-center text-center'>
              <img className="h-[100px] object-contain" src={sucrose_clipboard.src}></img>
            </div>
          </div>
        </div>
      </>
    );
  }
};

export default RequestWithoutLetterPage;