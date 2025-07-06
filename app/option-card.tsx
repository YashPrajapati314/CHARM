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

interface CardProps {
  title: string,
  image_src: string,
  page: string
};


const OptionCard = ({title, image_src, page}: CardProps) => {
  const router = useRouter();
  
  const goToPage = (page: string) => {
    router.push(page);
  }
  
  return (
      <div className='flex flex-row justify-center p-2 gap-1 rounded-sm w-64 bg-slate-500 hover:bg-slate-400 transition-colors duration-300' onClick={() => {goToPage(page)}}>
        <div className='flex justify-center items-center w-32'>
          <img src={image_src} className='w-32 object-contain'></img>
        </div>
        <div className='flex flex-col justify-center'>
          <div>
            {title}
          </div>
          {/* <div>
            {description}
          </div> */}
        </div>
      </div>
  );
}



export default OptionCard;