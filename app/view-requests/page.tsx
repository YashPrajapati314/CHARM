'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import '../styles/TeacherPage.css';
import qiqi_fallen from '../../images/qiqi-fallen.png'
import { AnimatePresence, easeInOut, motion } from 'framer-motion';

interface studyYearFormat {
    studyYear: number,
    yearName: string,
    yearShorthand: string
};

interface Response {
    years: studyYearFormat[]
}

const Years = () => {
    const [listOfYears, setListOfYears] = useState<studyYearFormat[]>([]);
    const [loadedYears, setLoadedYears] = useState<boolean>(false);
    const [errorScenario, setErrorScenario] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        fetchYears();
    }, []);

    useEffect(() => {
        console.log(listOfYears);
    }, [listOfYears]);


    const fetchYears = async () => {
        try 
        {
            const response = await fetch('/api/get-years', {
                method: 'GET'
            });
            if(response.status === 200)
            {
                setErrorScenario(false);
                const {years} = await response.json() as Response;
                setListOfYears(years);
                setLoadedYears(true);
            }
            else
            {
                setErrorScenario(true);
            }
        }
        catch (error)
        {
            setErrorScenario(true);
            console.error("Error fetching years:", error);
        }
    }

    const goToDepartmentSelectionPage = (year: string) => {
        console.log("Year Selected:", year);
        router.push(`${pathname}/${year}`);
    };


    return (
        errorScenario ? 
        (<div className="server-error">
            <img className="server-error-image" src={qiqi_fallen.src}></img>
            <p className='teacher-page-open'>Error fetching years</p>
            <p className='teacher-page-open'>This could be an internal server error, please try refreshing the page</p>
        </div>) :
        (<div className='teacher-view'>
            {listOfYears && (
                <div className="year-list">
                    <h2 className='teacher-page-open'>Please Select The Year Of Study</h2>
                    {loadedYears ? listOfYears.map((year, index) => ( //
                        <motion.button 
                            key={year.studyYear} 
                            className="year-button" 
                            onClick={() => {goToDepartmentSelectionPage(year.yearShorthand);}}
                            initial={{ opacity: 0, scale: 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1 }}
                            transition={{ duration: 0.3 * index, ease: "easeInOut" }}
                        >
                            {year.yearName} ({year.yearShorthand})
                        </motion.button>
                    )) :
                    <div className="loader"></div>
                    }
                    <br/>
                </div>
            )}
        </div>)
    );
}

export default Years;