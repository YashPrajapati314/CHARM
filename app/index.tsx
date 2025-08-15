'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './styles/HomePage.css';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import * as pdfjsLib from 'pdfjs-dist';
import { fileTypeFromBlob } from 'file-type';
import TableSkeleton from './table-loading-skeleton';
// import heic2any from 'heic2any';
import { Student } from '@prisma/client';
import { AnimatePresence, easeInOut, motion } from 'framer-motion';
import Header from './header';
import ConfirmationPopup from './confirmation';
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
import OptionCard from './option-card';
import letter_envelop from '../images/letter.svg'
import no_letter_envelop from '../images/no-letter.png'
import classroom from '../images/classroom.png'
import timetable from '../images/timetable.png'


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

      <p className='home-page description'>
        Post your attendance requests for one or more days and have it viewed by the teachers and granted!
        No more overhead of communication and workload on others
      </p>
      
      <br/>
      
      <div className='flex flex-col items-center gap-2'>
        <OptionCard
          title={'Make a request with a letter'}
          image_src={letter_envelop.src}
          page='request-with-letter'
        />

        <OptionCard
          title={'Make a request without a letter'}
          image_src={no_letter_envelop.src}
          page='request-without-letter'
        />

        <OptionCard
          title={'View requests by class'}
          image_src={classroom.src}
          page='view-requests'
        />

        <OptionCard
          title={'View requests by timetable'}
          image_src={timetable.src}
          page='view-requests-by-timetable'
        />
      </div>


      
      <br/>


      {/* {(
        <div className='no-letter' id='no-letter-div'>
          <h1 className='home-page'>Make a request without a letter</h1>
          <p className='home-page description'>
            If you don't have a letter available for the day and can't attend for a genuine reason,
            you can make a letterless request.
            Only go for this option if you have talked to the teachers about it before and they have agreed to mark
            you present without a letter being needed.
          </p>
        </div>
      )} */}
    </div>
  );
}

export default HomePage;