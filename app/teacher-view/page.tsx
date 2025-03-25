'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import '../styles/TeacherPage.css';
import qiqi_fallen from '../../images/qiqi-fallen.png'
import { AnimatePresence, easeInOut, motion } from 'framer-motion';

const TeacherPage = () => {
    const [listOfDepartments, setListOfDepartments] = useState<any[]>([]);
    const [listOfTeachers, setListOfTeachers] = useState<any[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [loadedDepartments, setLoadedDepartments] = useState<boolean>(false);
    const [loadedTeachers, setLoadedTeachers] = useState<boolean>(false);
    const [errorScenario, setErrorScenario] = useState<boolean>(false);
    const deptSelected = useRef<boolean>(false);
    const router = useRouter();

    useEffect(() => {
        const fetchDepartments = async () => {
            try 
            {
                const response = await fetch('/api/get-departments', {
                    method: 'GET'
                });
                if(deptSelected.current === false)
                {
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
            }
            catch (error)
            {
                console.error("Error fetching departments:", error);
            }
        }
        fetchDepartments();
    }, []);

    useEffect(() => {
        console.log(listOfDepartments);
    }, [listOfDepartments]);

    useEffect(() => {
        console.log(listOfTeachers);
    }, [listOfTeachers]);
    

    const fetchTeachers = async (department: string) => {
        console.log('Selected department:', department)
        setSelectedDepartment(department);
        setListOfTeachers([]);
        try
        {
            const response = await fetch(`/api/get-teachers?department=${department}`, {
                method: 'GET'
            });
            if(deptSelected.current === true)
            {
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
        }
        catch (error)
        {
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
            <p className='teacher-page-open'>Error fetching {selectedDepartment ? 'teachers' : 'departments'}</p>
            <p className='teacher-page-open'>This could be an internal server error, please try refreshing the page</p>
        </div>) :
        (<div className='teacher-view'>
            {!selectedDepartment ? (
                <div className="department-list">
                    <h2 className='teacher-page-open'>Please Select Your Department</h2>
                    {loadedDepartments ? listOfDepartments.map((dept, index) => (
                        <motion.button 
                            key={dept.departmentname} 
                            className="department-button" 
                            onClick={() => {deptSelected.current = true; fetchTeachers(dept.departmentname);}}
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
            ) : (
                <div className="teacher-list">
                    {selectedDepartment.trim() === 'First Year Block' ? <h2 className='teacher-page-open'>First Year Block</h2> : 
                    selectedDepartment.trim() === 'Other' ? <h2 className='teacher-page-open'>Other Departments</h2> : 
                    <h2 className='teacher-page-open'>Department of {selectedDepartment.trim()}</h2> }
                    {listOfTeachers.length > 0 ? <h2 className='teacher-page-open'>Teachers</h2> : <></>}
                    <button className="back-button" onClick={() => {deptSelected.current = false; setSelectedDepartment(null);}}>← Back</button>
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
                        <p className='teacher-page-open'>No teachers found in this department.</p>
                    )) :
                    <div className="loader"></div>
                    }
                </div>
            )}
        </div>)
    );
}

export default TeacherPage;