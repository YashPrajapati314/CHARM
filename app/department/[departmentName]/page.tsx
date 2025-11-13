'use client';

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import '@/app/styles/TeacherPage.css';
import qiqi_fallen from '@/images/webp/qiqi-fallen.webp'
import sucrose_clipboard from '@/images/webp/sucrose-clipboard.webp'
import { AnimatePresence, easeInOut, motion } from 'framer-motion';

const Teachers = () => {
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [listOfTeachers, setListOfTeachers] = useState<any[]>([]);
    const [loadedTeachers, setLoadedTeachers] = useState<boolean>(false);
    const [errorScenario, setErrorScenario] = useState<boolean>(false);
    const router = useRouter();

    const {departmentName} = useParams<{departmentName: string}>();
    const department = decodeURIComponent(departmentName || '');
    
    useEffect(() => {
        fetchTeachers(department);
    }, []);


    useEffect(() => {
        console.log(listOfTeachers);
    }, [listOfTeachers]);
    

    const fetchTeachers = async (department: string) => {

        console.log('Selected department:', department)
        setSelectedDepartment(department);
        setListOfTeachers([]);

        const params = new URLSearchParams();
        params.append('department', department);

        try
        {
            const response = await fetch(`/api/teachers?${params.toString()}`, {
                method: 'GET'
            });
            
            if(response.status === 200)
            {
                setErrorScenario(false);
                const {teachers} = await response.json();
                setListOfTeachers(teachers);
                setLoadedTeachers(true);
            }
            else
            {
                setErrorScenario(true);
            }
        }
        catch (error)
        {
            setErrorScenario(true);
            console.error("Error fetching teachers:", error);
        }
    }

    const fetchLectures = (teacherId: string) => {
        console.log("Teacher Selected:", teacherId);
        router.push(`/teacher/${teacherId}`);
    };


    return (
        errorScenario ? 
        (<div className="server-error">
            <img className="server-error-image" src={qiqi_fallen.src}></img>
            <p className='teacher-page-open'>Error fetching teachers</p>
            <p className='teacher-page-open'>This could be an internal server error, please try refreshing the page</p>
        </div>) :
        (<div className='teacher-view'>
            {selectedDepartment && (
                <div className="teacher-list">
                    {selectedDepartment.trim() === 'First Year Block' ? <h2 className='teacher-page-open'>First Year Block</h2> : 
                    selectedDepartment.trim() === 'Other' ? <h2 className='teacher-page-open'>Other Departments</h2> : 
                    <h2 className='teacher-page-open'>Department of {selectedDepartment.trim()}</h2> }
                    {listOfTeachers.length > 0 ? <h2 className='teacher-page-open'>Teachers</h2> : <></>}
                    {loadedTeachers ? (listOfTeachers.length > 0 ? (
                        listOfTeachers.map((teacher) => (
                            <motion.button 
                                key={teacher.id} 
                                className="teacher-button" 
                                onClick={() => fetchLectures(teacher.id)}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                {teacher.title} {teacher.name}
                            </motion.button>
                        ))
                    ) : (
                        <div className="teachers-not-found">
                            <p className='teacher-page-open'>No teachers found in this department.</p>
                            <img className="teachers-not-found-image" src={sucrose_clipboard.src}></img>
                        </div>
                    )) :
                    <div className="loader"></div>
                    }
                </div>
            )}
        </div>)
    );
}

export default Teachers;