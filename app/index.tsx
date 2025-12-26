'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '@/app/styles/HomePage.css';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import * as pdfjsLib from 'pdfjs-dist';
import { fileTypeFromBlob } from 'file-type';
import TableSkeleton from '@/app/table-loading-skeleton';
// import heic2any from 'heic2any';
import { Student } from '@prisma/client';
import { AnimatePresence, easeInOut, motion } from 'framer-motion';
import Header from './header';
import ConfirmationPopup from '@/app/confirmation';
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
import letter_envelop from '@/images/letter.svg';
import no_letter_envelop from '@/images/webp/no-letter.webp';
import classroom from '@/images/webp/classroom.webp';
import timetable from '@/images/webp/timetable.webp';
import question_mark from '@/images/webp/question-mark.webp';
import standard_profile_picture from '@/images/webp/account-profile-user-avatar-icon.webp';
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

const HomePage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status === 'loading') {
    <div className="loader-div">
      <div className="loader"></div>
    </div>
  }
  else {
    return (
      <div className='relative'>
        {
          session ? 
          <img 
            className='absolute top-0 right-2 z-50 w-10 h-10 cursor-pointer object-contain' 
            onClick={() => router.push('sign-in')}
            src={standard_profile_picture.src}
          /> :
          <button 
            className="
            absolute top-0 right-2 px-3 py-2 border-none cursor-pointer 
            text-sm bg-blue-600 text-white w-20 rounded-full 
            hover:bg-blue-800 transition-colors duration-300 ease-in-out
            max-[520px]:w-16
            max-[520px]:text-xs
            z-50"
            onClick={() => router.push('/sign-in')}
          >
            Sign In
          </button>
        }
  
        <div className='homepage'>
          <div className='top-container'>
            <h1 className={`home-page title ${dancingScript.className}`}>CHARM</h1>
            <h1 className={`home-page title-desc ${plwrtITModerna.className}`}>Centralized Home for Attendance Request Management</h1>
          </div>
  
          <p className='home-page description'>
            Post your attendance requests for one or more days and have it viewed by the teachers and granted!
            No more overhead of communication and workload on others
          </p>
          
          {/* <br/> */}
          
          <div className='flex flex-col items-center gap-3'>
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
  
            <OptionCard
              title={'Help and About'}
              image_src={question_mark.src}
              page='about'
            />
          </div>
          
          <br/>
        </div>
      </div>
    );
  }
}

export default HomePage;