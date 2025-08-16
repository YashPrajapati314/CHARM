'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import '../styles/TeacherPage.css';
import qiqi_fallen from '../../images/qiqi-fallen.png'
import keqing_sleeping from '../../images/keqing-sleeping.png'
import { AnimatePresence, easeInOut, motion } from 'framer-motion';

const Departments = () => {
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
            const response = await fetch('/api/get-departments', {
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


    return (
        <div className="server-error">
            <img className="server-error-image" src={keqing_sleeping.src}></img>
            <p className='teacher-page-open'>This feature is deprecated</p>
            <p className='teacher-page-open'>If needed, it might be brought up again, but for now, <a className='text-blue-500 hover:text-blue-700 underline cursor-pointer' onClick={() => redirectToBatchRequests('view-requests')}>this</a> gets the task done</p>
        </div>
    );
}

export default Departments;