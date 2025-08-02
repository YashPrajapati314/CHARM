'use client';

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import '../../../styles/TeacherPage.css';
import '../../../styles/RequestPage.css';
import qiqi_fallen from '../../../../images/qiqi-fallen.png'
import fischl_folded_arms from '../../../../images/fischl-folded-arms.png'
import sucrose_clipboard from '../../../../images/sucrose-clipboard.png'
import { AnimatePresence, easeInOut, motion } from 'framer-motion';
import { SrvRecord } from "dns";
import { buffer } from "stream/consumers";

interface Batch {
    batchid: string,
    studyyear: number,
    dept: string,
    div: number,
    batch: number
};

interface Response {
    batches: Batch[]
};

// Change Teachers to Divisions or Batches
const Batches = () => {
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [selectedBatches, setSelectedBatches] = useState<Record<string, boolean>>({});
    const [listOfBatches, setListOfBatches] = useState<Batch[]>([]);
    const [loadedBatches, setLoadedBatches] = useState<boolean>(false);
    const [errorScenario, setErrorScenario] = useState<boolean>(false);
    const [errorScenario2, setErrorScenario2] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();

    const {studyYear, departmentName} = useParams<{studyYear: string, departmentName: string}>(); //
    const department = decodeURIComponent(departmentName || '');
    const year = decodeURIComponent(studyYear || '' );

    useEffect(() => {
        fetchBatches(department, year);
    }, []);
    
    
    useEffect(() => {
        console.log(listOfBatches);
    }, [listOfBatches]);
    
    useEffect(() => {
        console.log(selectedBatches);
    }, [selectedBatches])
    
    const toggleBatchSelection = (batchId: string) => {
        setSelectedBatches((prev) => ({
            ...prev,
            [batchId]: !prev[batchId]
        }));
    }

    
    const fetchLectures = (batchIds: string) => {
        console.log("Batch Selected:", batchIds);
        router.push(`/view-requests-for-batches/${batchIds}`);
    };
    
    const handleBatchSubmit = () => {
        const listOfSelectedBatches = Object.entries(selectedBatches).filter(([batchId, isChecked]) => (isChecked)).map(([batchId]) => batchId);
        console.log("Batch Selected:", listOfSelectedBatches);
        fetchLectures(listOfSelectedBatches.join('&'));      
    }

    const fetchBatches = async (department: string, year: string) => {
        console.log('Selected department:', department)
        setSelectedDepartment(department);
        setListOfBatches([]);
        try
        {
            const response = await fetch(`/api/get-batches?year=${year}&department=${department}`, {
                method: 'GET'
            });
            if(response.status === 200)
            {
                setErrorScenario(false);
                const {batches} = await response.json() as Response;
                setListOfBatches(batches);
                setLoadedBatches(true);
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
            console.error("Error fetching batches:", error);
        }
    }


    return (
        errorScenario ? 
        (<div className="server-error">
            <img className="server-error-image" src={qiqi_fallen.src}></img>
            <p className='teacher-page-open'>Error fetching batches</p>
            <p className='teacher-page-open'>This could be an internal server error, please try refreshing the page</p>
        </div>) :
        (errorScenario2 ? 
        <>
            <div className="invalid-request">
                <img className="invalid-request-image" src={fischl_folded_arms.src}></img>
                <h1 className='request-page'>No such department found... Perhaps you have mistyped the URL</h1>
            </div>
        </> :
        (<div className='teacher-view'>
            {selectedDepartment && (
                <div className="teacher-list">
                    {selectedDepartment.trim() === 'First Year Block' ? <h2 className='teacher-page-open'>First Year Block</h2> : 
                    selectedDepartment.trim() === 'Other' ? <h2 className='teacher-page-open'>Other Departments</h2> : 
                    <h2 className='teacher-page-open'>Department of {selectedDepartment.trim()} ({year})</h2> }
                    {listOfBatches.length > 0 ? <h2 className='text-xl'>Select Batches To View Requests Of</h2> : <></>}
                    {loadedBatches ? (listOfBatches.length > 0 ? (
                        <>
                            {listOfBatches.map((batch) => (
                                <motion.div 
                                    key={`div_${batch.batchid}`} 
                                    className={
                                        selectedBatches[batch.batchid] ? 
                                        "flex flex-row w-[140] gap-2 px-6 py-2 items-center justify-center rounded-full text-lg text-cyan-900 bg-emerald-400 cursor-pointer transition duration-200 ease-in-out select-none" : 
                                        "flex flex-row w-[140] gap-2 px-6 py-2 text-center items-center justify-center rounded-full text-lg text-cyan-900 bg-emerald-300 cursor-pointer transition duration-200 ease-in-out select-none"
                                    }
                                    id={`${batch.batchid}`}
                                    onClick={() => toggleBatchSelection(batch.batchid)}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    {selectedBatches[batch.batchid] ? `✔ ${batch.batchid}` : `${batch.batchid}`}
                                </motion.div>
                            ))}
                            <motion.button
                                onClick={handleBatchSubmit}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full transition duration-200 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                disabled={Object.keys(selectedBatches).length === 0 || Object.values(selectedBatches).every((isChecked) => !isChecked) ? true : false}
                            >
                                View Requests of Selected Batches
                            </motion.button>
                        </>
                    ) : (
                        <div className="batches-not-found">
                            <p className='teacher-page-open'>No batches found in this department.</p>
                            <img className="batches-not-found-image" src={sucrose_clipboard.src}></img>
                        </div>
                    )) :
                    <div className="loader"></div>
                    }
                </div>
            )}
        </div>))
    );
}

export default Batches;