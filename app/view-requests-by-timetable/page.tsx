'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import '@/app/styles/TeacherPage.css';
import qiqi_fallen from '@/images/webp/qiqi-fallen.webp'
import keqing_sleeping from '@/images/webp/keqing-sleeping.webp'
import { AnimatePresence, easeInOut, motion } from 'framer-motion';
import { Dancing_Script, Playwrite_IT_Moderna } from 'next/font/google';
import sucrose_clipboard from '@/images/webp/sucrose-clipboard.webp'
import { useSession } from "next-auth/react";

const plwrtITModerna = Playwrite_IT_Moderna({
  variable: "--font-dancing-script"
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

const Departments = () => {
    const { data: session, status } = useSession();
    const [listOfDepartments, setListOfDepartments] = useState<any[]>([]);
    const [loadedDepartments, setLoadedDepartments] = useState<boolean>(false);
    const [errorScenario, setErrorScenario] = useState<boolean>(false);
    const router = useRouter();

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        console.log(listOfDepartments);
    }, [listOfDepartments]);


    const fetchDepartments = async () => {
        try 
        {
            const response = await fetch('/api/departments', {
                method: 'GET'
            });
            if(response.status === 200)
            {
                setErrorScenario(false);
                const {departments} = await response.json();
                setListOfDepartments(departments);
                setLoadedDepartments(true);
            }
            else
            {
                setErrorScenario(true);
            }
        }
        catch (error)
        {
            setErrorScenario(true);
            console.error("Error fetching departments:", error);
        }
    }

    const fetchTeachers = (department: string) => {
        console.log("Department Selected:", department);
        router.push(`/department/${department}`);
    };
    
    const redirectToBatchRequests = (URLComponent: string) => {
        console.log("Redirecting...");
        router.push(`${URLComponent}`);
    }

    if (status === 'loading') {
        <div className="loader-div">
            <div className="loader"></div>
        </div>
    }
    else if (session) {
        return (
            <div className="server-error">
                <img className="server-error-image" src={keqing_sleeping.src}></img>
                <p className='teacher-page-open'>This feature is deprecated</p>
                <p className='teacher-page-open'>If needed, it might be brought up again, but for now, <a className='text-blue-500 hover:text-blue-700 underline cursor-pointer' onClick={() => redirectToBatchRequests('view-requests')}>this</a> gets the task done</p>
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
}

export default Departments;