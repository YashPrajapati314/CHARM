'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, easeInOut, motion } from 'framer-motion';
import { Skeleton } from "@/components/ui/skeleton"
import TableSkeleton from '@/app/table-loading-skeleton'
import '@/app/styles/RequestPage.css';
import qiqi_fallen from '@/images/webp/qiqi-fallen.webp'
import yanfei_thinking from '@/images/webp/yanfei-thinking.webp'
import fischl_folded_arms from '@/images/webp/fischl-folded-arms.webp'
import { DateTime } from 'luxon';
import { Dancing_Script, Playwrite_IT_Moderna } from 'next/font/google';

const plwrtITModerna = Playwrite_IT_Moderna({
  variable: "--font-dancing-script"
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

const AttendancesForLecture = () => {

    // interface Lecture {
    //     batchid: string;
    //     weekday: string;
    //     starttime: string;
    //     endtime: string;
    //     subject: string;
    //     Module: {
    //         course_name: string;
    //     };
    // }

    interface StudentWithRequests {
        sapid: number;
        name: string;
        rollno: number;
        batchid: string;
        listofrequests: {
            letterstatus: number;
            reason: string;
            imagelinks: string[];
        }[];
    }

    interface AttendanceRequestResponse {
        requests: StudentWithRequests[];
    }

    // interface LectureResponse {
    //     lectureDetails: Lecture[];
    // }

    const { batchIds } = useParams<{batchIds: string}>();
    const decodedBatchIds = decodeURIComponent(batchIds);
    const selectedBatches = decodedBatchIds.split('&');
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const [listOfStudentsWithRequests, setlistOfStudentsWithRequests] = useState<StudentWithRequests[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentWithRequests | null>(null);
    // const [lecture, setLecture] = useState<Lecture | null>();
    // const [loadedTitle, setLoadedTitle] = useState<boolean>(false);
    const [loadedRequests, setLoadedRequests] = useState<boolean>(false);
    // const [errorScenario1, setErrorScenario1] = useState<boolean>(false);
    const [errorScenario2, setErrorScenario2] = useState<boolean>(false);
    const [invalidDayScenario, setInvalidDayScenario] = useState<boolean>(false);
    const [invalidRequestScenario, setInvalidRequestScenario] = useState<boolean>(false);
    const [dateToday, ordinalSuffixForToday, monthToday, yearToday] = getFormattedDate();
    const router = useRouter();

    useEffect(() => {
        const fetchAttendanceRequests = async () => {
            try {
                const response = await fetch(`/api/get-requests-by-batches?batchIds=${batchIds}`, {
                    method: 'GET',
                    headers: { "Content-Type": "application/json" },
                    // body: JSON.stringify({ batchIds: selectedBatches })
                });

                console.log(response.status);

                if(response.status === 200)
                {
                    setErrorScenario2(false);
                    setInvalidRequestScenario(false);
                    setInvalidDayScenario(false);
                    console.log('Response', response);
                    const {requests} = await response?.json() as AttendanceRequestResponse;
                    sortRequests(requests);
                    setlistOfStudentsWithRequests(requests);
                    console.log('Requests', requests);
                    setLoadedRequests(true);
                }
                else if(response.status === 400)
                {
                    setErrorScenario2(false);
                    setInvalidRequestScenario(false);
                    setInvalidDayScenario(true);
                }
                else if(response.status === 404)
                {
                    setErrorScenario2(false);
                    setInvalidDayScenario(false);
                    setInvalidRequestScenario(true);
                }
                else
                {
                    setErrorScenario2(true);
                }
            }
            catch (error) {
                setErrorScenario2(true);
                console.error("Error fetching attendance requests:", error);
            }
        };
        fetchAttendanceRequests();
    }, []);

    // useEffect(() => {
    //     const getLectureDetails = async() => {
    //         try {
    //             const response = await fetch('/api/get-lecture-details', {
    //                     method: 'POST',
    //                     headers: { "Content-Type": "application/json" },
    //                     body: JSON.stringify({lectureIds: [lectureId]})
    //                 }
    //             );
    //             if(response.status === 200)
    //             {
    //                 setErrorScenario1(false);
    //                 console.log(response);
    //                 const {lectureDetails} = await response.json() as LectureResponse;
    //                 setLecture(lectureDetails[0]);
    //                 console.log(lectureDetails);
    //                 setLoadedTitle(true);
    //             }
    //             else
    //             {
    //                 setLoadedTitle(true);
    //                 setErrorScenario1(true);
    //             }
    //         }
    //         catch (error) {
    //             setErrorScenario1(true);
    //             console.error("Error fetching lecture details:", error);
    //         }
    //     };
    //     getLectureDetails();
    // }, []);

    useEffect(() => {
        console.log(listOfStudentsWithRequests);
    }, [listOfStudentsWithRequests]);

    // useEffect(() => {
    //     console.log(lecture);
    // }, [lecture]);

    useEffect(() => {
        if(selectedStudent)
        {
            const element = document.getElementById('list-of-requests');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [selectedStudent]);

    const selectStudent = (std: StudentWithRequests) => {
        if(selectedStudent === std)
        {
            setSelectedStudent(null);
        }
        else
        {
            setSelectedStudent(std);
        }
    }

    function actualDateHereNowAndJustTheDate(): Date
    {
        const ISTNow = DateTime.now().setZone("Asia/Kolkata");
        const time = new Date();
        const date = new Date(`${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}`);
        // date.setHours(5, 30, 0, 0);
        const localDate = new Date("1970-01-01T00:00:00")
        const utcDate = new Date("1970-01-01T00:00:00Z")
        console.log(localDate.getTime() - utcDate.getTime())
        return date;
    }

    function sortRequests(requestList: StudentWithRequests[]): void
    {
        requestList?.sort((a, b) => {
            // if (a.batchid < b.batchid) return -1;
            // if (a.batchid > b.batchid) return 1;
            if (a.rollno < b.rollno) return -1;
            if (a.rollno > b.rollno) return 1;
            return 0;
        });
        requestList?.forEach((student) => {
            student.listofrequests.sort((a, b) => {
                if (a.letterstatus < b.letterstatus) return -1;
                if (a.letterstatus > b.letterstatus) return 1;
                return 0;
            })
        });
    }

    function formatTime(time: string | undefined): string
    {
        if(time)
        {
            const formatted_time: string = time.split(/[T.]/)[1];
            return formatted_time.slice(0, -3);
        }
        return '';
    }

    function getFormattedDate(): Array<string>
    {
        const ISTNow = DateTime.now().setZone("Asia/Kolkata");
        if(ISTNow)
        {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const date = ISTNow.day;
            const month = ISTNow.month;
            const year = ISTNow.year;
            let ordinal_suffix: string;
            switch(date % 100)
            {
                case 11:
                    ordinal_suffix = 'th';
                    break;
                case 12:
                    ordinal_suffix = 'th';
                    break;
                case 13:
                    ordinal_suffix = 'th';
                    break;
                default:
                    switch(date % 10)
                    {
                        case 1:
                            ordinal_suffix = 'st';
                            break;
                        case 2:
                            ordinal_suffix = 'nd';
                            break;
                        case 3:
                            ordinal_suffix = 'rd';
                            break;
                        default:
                            ordinal_suffix = 'th';
                            break;    
                    }
                    break;
            }
            return [date.toString(), ordinal_suffix, months[month - 1], year.toString()];
        }
        return ['', '', '', ''];
    }

    return (
        errorScenario2 ? 
        (<div className="server-error">
            <img className="server-error-image" src={qiqi_fallen.src}></img>
            <p className='request-page'>Error fetching lectures</p>
            <p className='request-page'>This could be an internal server error, please try refreshing the page</p>
        </div>) :
        (
            (invalidDayScenario || invalidRequestScenario) ?
            <>
                <>
                    <div className="invalid-request">
                        <img className="invalid-request-image" src={fischl_folded_arms.src}></img>
                        <h1 className='request-page'>One or more of the requested batches do not exist. Perhaps you have mistyped the URL</h1>
                    </div>
                </>
                {/* {
                    invalidRequestScenario ?
                    <>
                        <div className="invalid-request">
                            <img className="invalid-request-image" src={fischl_folded_arms.src}></img>
                            <h1 className='request-page'>No such lecture found... Perhaps you have lost your way</h1>
                        </div>
                    </> :
                    <>
                        <div className="invalid-day">
                            <img className="invalid-day-image" src={fischl_folded_arms.src}></img>
                            <h1 className='request-page'>The requested lecture exists but is not scheduled for today</h1>
                        </div>
                    </>
                } */}
            </> :
            (<div className="request-list">
                <h1 className={`charm ${dancingScript.className}`}>CHARM</h1>
                {
                    (<div className='title-and-table-container'>
                        {
                            <>
                                <h1 className='request-page'>Attendance Requests for <br></br> {dateToday}<sup>{ordinalSuffixForToday}</sup> {monthToday} {yearToday} </h1>
                                <h1 className='request-page'>
                                    {selectedBatches.join(', ')} 
                                    {/* <br></br>
                                    {dateToday}<sup>{ordinalSuffixForToday}</sup> {monthToday} {yearToday} 
                                    <br></br> */}
                                </h1>
                            </>
                        }
                        {loadedRequests ? 
                            ( listOfStudentsWithRequests?.length > 0 ?
                            <motion.div className='body-container'
                                initial={{ opacity: 0, scale: 1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                <div className='colour-key-div'>
                                    <details className='colour-details'>
                                        <summary className='colour-key-header'>
                                            What do the colours mean?
                                        </summary>
                                        <div className='colour-key-desc'>
                                            Each row is assigned a particular colour to make it easier to check for a request's validity
                                        </div>
                                        <div className='colour-key'>
                                            <div className='colour-explanation-pair'>
                                                <div className='colour-square green-square'></div>
                                                <h6 className='explanation green-text'>Green means all the details have been extracted from the letter automatically</h6>
                                            </div>
                                            <div className='colour-explanation-pair'>
                                                <div className='colour-square yellow-square'></div>
                                                <h6 className='explanation yellow-text'>Yellow suggests that the <b>name has been entered manually</b> apart from the ones extracted from the letter</h6>
                                            </div>
                                            <div className='colour-explanation-pair'>
                                                <div className='colour-square orange-square'></div>
                                                <h6 className='explanation orange-text'>Orange indicates that the <b>date has been entered manually</b>, other than the ones that could be detected in the letter</h6>
                                            </div>
                                            <div className='colour-explanation-pair'>
                                                <div className='colour-square red-square'></div>
                                                <h6 className='explanation red-text'>Red means <b>no letter</b> has been attached with the associated request</h6>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                                <h1 className='request-page desc'>Click on a row to view the student's letter / request details</h1>
                                <div className='request-table-container-container'>
                                    <div className='request-table-container'>
                                        <table className='request-table'>
                                            <thead>
                                                <tr>
                                                    <th>SAP ID</th>
                                                    <th>Name</th>
                                                    <th>Batch</th>
                                                    <th>Roll No</th>
                                                    <th>Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    listOfStudentsWithRequests.map((student) => {
                                                        const std = student as StudentWithRequests;
                                                        // const minLetterStatus = Math.min(...std.listofrequests.map(request => request.letterstatus));
                                                        const minLetterStatus = std.listofrequests[0].letterstatus;
                                                        return (
                                                            <tr
                                                            key={`${std.sapid}`}
                                                            className={`request ` + 
                                                                (minLetterStatus === 0 ? `green-row` : (
                                                                    minLetterStatus === 1 ? `yellow-row` : (
                                                                        minLetterStatus === 2 ? `orange-row` :
                                                                            `red-row`))) + (selectedStudent?.sapid === std.sapid ? ` selected-${minLetterStatus}` : ``) 
                                                            }
                                                            onClick={() => selectStudent(std)}
                                                            >
                                                                <td>{std.sapid}</td>
                                                                <td>{std.name}</td>
                                                                <td>{std.batchid}</td>
                                                                <td>{std.rollno}</td>
                                                                <td className={(std.listofrequests[0].reason?.split(/\s+/).every(word => word.length < 12) && std.listofrequests[0].reason?.split(/\s+/).length < 5) ? `` : `truncatable`}>{std.listofrequests[0].reason} {std.listofrequests.length > 1 ? `& ${std.listofrequests.length - 1} other${std.listofrequests.length > 2 ? 's' : ''}` : ``}</td>
                                                            </tr>
                                                        );
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className='root-request-container'>
                                    <div  id='list-of-requests'>
                                        {selectedStudent && 
                                        (<div className='all-requests-container'>
                                            <div className='approve-info'>
                                                Kindly go through all the requests till a valid request is found
                                            </div>
                                            <div className='all-requests'>
                                                <p className='request-page students-name-request'>{selectedStudent.name}'s Request{selectedStudent.listofrequests.length > 1 ? 's' : ''}</p>
                                                {
                                                    selectedStudent.listofrequests.map((request, index) =>  (
                                                        <div id={`${index}`} key={index} className={`image-container image-container-${request.letterstatus}`}>
                                                            <>
                                                                <p className='request-page' style={{fontWeight: 'bold', color: (request.letterstatus === 0 ? 'green' : (
                                                                            request.letterstatus === 1 ? 'rgb(255, 208, 0)' : (
                                                                                request.letterstatus === 2 ? 'orange' :
                                                                                    'red')))}}>Request {index + 1} {request.letterstatus === 0 ? '' : request.letterstatus === 1 ? '(Manually Entered Name)' : request.letterstatus === 2 ? '(Modified Date)' : request.letterstatus === 3 ? '(No Letter Uploaded)' : ''}</p>
                                                                <div className='request-reason-container'>
                                                                    <p className='request-page request-reason'>Reason: {request.reason}</p>
                                                                </div>
                                                                {request.imagelinks.map((imageLink, imageIndex) => {
                                                                    return <a id={`${imageIndex}`} key={imageIndex} href={imageLink} target='_blank'><img src={imageLink} id={`${imageIndex}`} key={imageIndex} className='letter-image' alt='Deleted Image'></img></a>
                                                                })}
                                                            </>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>)}
                                    </div>
                                </div>
                            </motion.div>
                            :
                            <div className="no-requests">
                                <img className="no-requests-image" src={yanfei_thinking.src}></img>
                                <p>No attendance requests for {selectedBatches.length > 1 ? `these batches` : `this batch`}...</p>
                                <p>Quite surprising</p>
                            </div> ) :
                            <>
                                <br></br>
                                <TableSkeleton />
                                {/* <div className="loader"></div> */}
                            </>
                        }
                    </div>)
                }
            </div>)
        )
    );
};

export default AttendancesForLecture;
