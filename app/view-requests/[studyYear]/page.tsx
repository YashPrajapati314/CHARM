'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import '@/app/styles/TeacherPage.css';
import '@/app/styles/RequestPage.css'
import qiqi_fallen from '@/images/webp/qiqi-fallen.webp'
import fischl_folded_arms from '@/images/webp/fischl-folded-arms.webp'
import { AnimatePresence, easeInOut, motion } from 'framer-motion';
import { Dancing_Script, Playwrite_IT_Moderna } from 'next/font/google';

const plwrtITModerna = Playwrite_IT_Moderna({
  variable: "--font-dancing-script"
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

const Departments = () => {
    const [listOfDepartments, setListOfDepartments] = useState<any[]>([]);
    const [loadedDepartments, setLoadedDepartments] = useState<boolean>(false);
    const [errorScenario, setErrorScenario] = useState<boolean>(false);
    const [errorScenario2, setErrorScenario2] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();
    const {studyYear} = useParams<{studyYear: string}>();

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        console.log(listOfDepartments);
    }, [listOfDepartments]);


    const fetchDepartments = async () => {
        try 
        {
            const response = await fetch(`/api/get-departments-for-year?year=${studyYear}`, {
                method: 'GET'
            });
            if(response.status === 200)
            {
                setErrorScenario(false);
                setErrorScenario2(false);
                const {departments} = await response.json();
                setListOfDepartments(departments);
                setLoadedDepartments(true);
            }
            else if(response.status === 400)
            {
                setErrorScenario2(true);
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
        router.push(`${pathname}/${department}`);
    };


    return (
        errorScenario ? 
        (<div className="server-error">
            <img className="server-error-image" src={qiqi_fallen.src}></img>
            <p className='teacher-page-open'>Error fetching departments</p>
            <p className='teacher-page-open'>This could be an internal server error, please try refreshing the page</p>
        </div>) :
        (errorScenario2 ? 
        <>
            <div className="invalid-request">
                <img className="invalid-request-image" src={fischl_folded_arms.src}></img>
                <h1 className='request-page'>No such year found... Perhaps you have mistyped the URL</h1>
            </div>
        </> :
        (<div className='teacher-view'>
            <h1 className={`charm ${dancingScript.className}`}>CHARM</h1>
            {listOfDepartments && (
                <div className="department-list">
                    <h2 className='teacher-page-open'>Please Select The Department ({studyYear})</h2>
                    {loadedDepartments ? listOfDepartments.map((dept, index) => (
                        <motion.button 
                            key={dept.departmentname} 
                            className="department-button" 
                            onClick={() => {fetchTeachers(dept.departmentname);}}
                            initial={{ opacity: 0, scale: 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1 }}
                            transition={{ duration: 0.3 * index, ease: "easeInOut" }}
                        >
                            {dept.departmentname}
                        </motion.button>
                    )) :
                    <div className="loader"></div>
                    }
                    <br/>
                </div>
            )}
        </div>))
    );
}

export default Departments;