'use client';

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import '@/app/styles/TeacherPage.css';
import '@/app/styles/RequestPage.css';
import qiqi_fallen from '@/images/webp/qiqi-fallen.webp'
import fischl_folded_arms from '@/images/webp/fischl-folded-arms.webp'
import sucrose_clipboard from '@/images/webp/sucrose-clipboard.webp'
import { AnimatePresence, easeInOut, motion } from 'framer-motion';
import { SrvRecord } from "dns";
import { buffer } from "stream/consumers";
import { Dancing_Script, Playwrite_IT_Moderna } from 'next/font/google';

const plwrtITModerna = Playwrite_IT_Moderna({
  variable: "--font-dancing-script"
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

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
        listOfSelectedBatches.sort();
        fetchLectures(listOfSelectedBatches.join('&'));      
    }

    const fetchBatches = async (department: string, year: string) => {
        console.log('Selected department:', department)
        setSelectedDepartment(department);
        setListOfBatches([]);
        try
        {
            const params = new URLSearchParams();
            params.append('year', year);
            params.append('department', department);

            const response = await fetch(`/api/batches?${params.toString()}`, {
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
                <>
                    <h1 className={`charm ${dancingScript.className}`}>CHARM</h1>
                    <div className="teacher-list">
                        {selectedDepartment.trim() === 'First Year Block' ? <h2 className='teacher-page-open'>First Year Block</h2> : 
                        selectedDepartment.trim() === 'Other' ? <h2 className='teacher-page-open'>Other Departments</h2> : 
                        <h2 className='teacher-page-open'>Department of {selectedDepartment.trim()} ({year})</h2> }
                        {listOfBatches.length > 0 ? <h2 className='text-xl'>Select Batches To View Requests Of</h2> : <></>}
                        {loadedBatches ? (listOfBatches.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    {listOfBatches.map((batch, index) => (
                                        <motion.div 
                                            key={`div_${batch.batchid}`} 
                                            className={
                                                `${selectedBatches[batch.batchid]
                                                ? "bg-emerald-400"
                                                : "bg-emerald-300"}
                                                flex flex-row w-[130px] gap-2 px-2 py-2 items-center justify-center rounded-full text-base text-cyan-900 cursor-pointer transition duration-200 ease-in-out select-none
                                                ${((index === listOfBatches.length - 1) && (listOfBatches.length % 2 === 1)) ? "col-span-2 justify-self-center" : ""}`
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
                                </div>
                                <motion.button
                                    onClick={handleBatchSubmit}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-base rounded-full transition duration-200 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                </>
            )}
        </div>))
    );
}

export default Batches;