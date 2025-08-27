'use client';

import React, { useEffect, useState } from "react";
import '@/app/styles/HomePage.css';
import { Dancing_Script, Playwrite_IT_Moderna } from 'next/font/google';
import Faq from "react-faq-component";
import ganyu_happy from '@/images/webp/ganyu-happy.webp'


const plwrtITModerna = Playwrite_IT_Moderna({
  variable: "--font-dancing-script"
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});


const About = () => {
    const QnAs = {
        title: "Help and FAQs",
        rows: [
            {
                title: "What is CHARM and why was it created?",
                content: <p className='text-lg'>Since several of you must have faced scenarios where you can't attend lectures due to a genuine reason like working for a committee / student club, going for a hackathon or interview, etc. you might be aware that you need to submit a letter to your teachers as a proof of truthfulness to be granted attendance for the lectures you couldn't attend as you were busy. <br></br> The question now is how will the teachers be informed of this and shown the letter with valid reason for your absence when you won't be present to show it. Usually, you would resort to asking a friend or classmate attending the lecture so they can show your letter while the attendance is being taken. <br></br> However, it is not always possible to find a student who would be present in every lecture to show your requests, secondly if such a student does exist, they would be bombarded with such requests from everyone. Now this one person has to look through a bunch of requests (which were sent to them either yesterday, a few days ago, or even during that lecture!) among other messages, all while the attendance is being taken. <br></br> Obviously, it is very easy to miss out marking someone's attendance among this chaos, and teachers also struggle to keep halting for verifying those letters. <br></br> To eliminate this burden from everyone involved, I created CHARM (Centralized Home for Attendance Request Management). CHARM allows students and teachers to make and view attendance requests conveniently. No more overhead of intermediate communication, no more missed requests, just post, view and relax!</p>,
            },
            {
                title: "How to make requests using CHARM?",
                content: <p className='text-lg'>CHARM has been crafted with extreme detail, keeping user-centric design in mind. You can upload letters on CHARM, through which SAP IDs will be extracted and looked up in the student database. The list of those students and their details then appear as a table, in which you can select particular rows to make a request for, along with the dates for which you wish to make the request, and the reason. To make things more convenient, the dates and reasons also get automatically extracted if they are visible in the letter (also works with all the dates in a date range!), so now you are just a few clicks away from confirming and posting the request. If you do not have a letter but still have a valid request to make, you can go to the post request without letter option and enter your SAP IDs to proceed similarly.</p>,
            },
            {
                title: "What if the OCR models miss something out?",
                content: <p className='text-lg'>It's certainly possible for OCR models to return some details incorrectly. To take care of this, if the model ever fails to detect your SAP ID from the letter, you can always add it to the list manually! Similarly, any missed out dates can also be added. Though these requests get flagged for review to prevent potential abuse.</p>
            },
            {
                title: "How to view requests using CHARM?",
                content: <p className='text-lg'>Viewing requests is as straightforward as possible. You select the year and navigate to the department you are taking the lecture of, and select the batches you wish to view the requests of. You can select multiple batches. The page shows all the requests for the selected batches for today. An older option to view requests by timetable is now deprecated since viewing requests by batches nearly gets the same thing done with only a fraction of the efforts required in module booking and setting the timetable.</p>
            },
            {
                title: "What do different colours of requests indicate?",
                content: <p className='text-lg'>When all of the details in the request (the SAP IDs and the dates for which the requests were made) have been extracted purely by OCR models, the rows are coloured green. This indicates that the request is very likely true, given the letter isn't fabricated. If a SAP ID has been added to the request list manually, it's coloured as yellow to highlight for rechecking whether that SAP ID is actually in the letter. Orange rows are requests which are made for a day that couldn't be extracted from the letter. Consider vetting the attached letter thoroughly to ensure if the request is actually valid for that day. Red rows are of the requests made without a letter. The details here are only conveyed through the reason.</p>
            },
            {
                title: "Are there any limits or constraints for the uploaded contents?",
                content: <p className='text-lg'>Due to storage limitations, CHARM only supports an upload of a maximum of 10 images at once, with each image being no larger than 5 MBs. Usually letters aren't that long, nor would an image normally be of quality / resolution that high. Each page of a PDF is treated as an individual image. If there was ever a case where your request exceeded these constraints and you aren't able to upload, please resort to an alternative like uploading your request onto a separate cloud storage and linking it in the reason text of the request. Reasons are limited to 256 characters, and the file formats supported for upload are JPG, PNG, HEIC, and PDF.</p>
            },
            {
                title: "Can requests posted once be deleted?",
                content: <p className='text-lg'>Since CHARM has no authentication or authorization mechanisms for the moment, deletion of requests is not possible. Requests of the past would be deleted, but if you ever wanted a request you posted to be deleted immediately, please <a className='text-blue-600 underline' href="mailto:yashprajapati.professionalmail@gmail.com">contact me</a>.</p>
            },
            {
                title: "How does CHARM work? Can it handle every possible scenario flawlessly?",
                content: <p className='text-lg'>I have put in a lot of efforts and thought to ensure perfection (for knowing the exact details and interesting stuff, please <a className='text-blue-600 underline' href="mailto:yashprajapati.professionalmail@gmail.com">contact me</a>), but of course, things can always go wrong or be overlooked somehow. If you discover any bugs or encounter any issues, feel free to <a className='text-blue-600 underline' href="mailto:yashprajapati.professionalmail@gmail.com">reach out to me</a>!</p>
            },
            {
                title: "Where are the chibi characters that appear on CHARM from?",
                content: <p className='text-lg'>They are from the video game Genshin Impact! No copyright infringement intended of course!</p>
            },
            {
                title: "Where can you get in touch with me?",
                content: <p className='text-lg'>You can reach out to me <a className='text-blue-600 underline' href="mailto:yashprajapati.professionalmail@gmail.com">here</a>!</p>
            }
        ]
    };

    const styles = {
        titleTextColor: "grey",
        rowTitleColor: "#c66bff",
        rowContentColor: '#1e0078',
        // arrowColor: "grey",
    };

    const config = {
        animate: true,
        tabFocus: true
    };


    return (
        <div className='about-page'>
            <div className='top-container'>
                <h1 className={`home-page title ${dancingScript.className}`}>CHARM</h1>
                {/* <h1 className={`home-page title-desc ${plwrtITModerna.className}`}>Centralized Home for Attendance Request Management</h1> */}
            </div>
            <h1 className='text-center text-3xl my-4 text-blue-800'>About</h1>
            <Faq
                data={QnAs}
                styles={styles}
                config={config}
            />
            <div className="about-image-container">
                <img className="about-image" src={ganyu_happy.src}></img>
                <p className="text-lg text-gray-600">Thank you for using CHARM!</p>
            </div>
        </div>
    );
}

export default About;