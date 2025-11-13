/* Deprecated */

"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, easeInOut, motion } from 'framer-motion';
import '@/app/styles/LecturePage.css';
import qiqi_fallen from '@/images/qiqi-fallen.png'
import keqing_sleeping from '@/images/keqing-sleeping.png'
import { end } from "@patternfly/react-core/dist/esm/helpers/Popper/thirdparty/popper-core";

const TeacherProfile = () => {
    const {teacherId} = useParams();
    const today = actualDateHereNowAndJustTheDate();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const [listOfLectures, setListOfLectures] = useState<Lecture[]>([]);
    const [loadedLectures, setLoadedLectures] = useState<boolean>(false);
    const [errorScenario, setErrorScenario] = useState<boolean>(false);
    const router = useRouter();

    interface Module {
        course_code: string;
        course_name: string;
    }

    interface Lecture {
        batchid: string;
        lectureid: string;
        starttime: string;
        endtime: string;
        subject: string;
        Module: Module;
    }

    interface Response {
        lectures: Lecture[];
    }

    useEffect(() => {
        const fetchLectures = async () => {
            try {
                const response = await fetch(`/api/lectures?teacherId=${teacherId}&today=${today}`, {
                    method: 'GET'
                });
                if(response.status === 200)
                {
                    setErrorScenario(false);
                    console.log(response);
                    const {lectures} = await response.json() as Response;
                    sortLectures(lectures);
                    setListOfLectures(lectures);
                    console.log(lectures);
                    setLoadedLectures(true);
                }
                else
                {
                    setErrorScenario(true);
                }
            } catch (error) {
                console.error("Error fetching lectures:", error);
            }
        };
        fetchLectures();
    }, []);

    useEffect(() => {
        console.log(listOfLectures);
    }, [listOfLectures]);

    const fetchAttendanceRequests = (lectureId: string) => {
        console.log("Lecture Selected:", lectureId);
        router.push(`/lecture/${lectureId}`);
    };

    const fetchMultipleLecturesAttendanceRequests = () => {
        const currentlyOngoingLectures: string[] = [];
        listOfLectures.map((lecture) => {
            if(currentlyOngoing(lecture))
            {
                currentlyOngoingLectures.push(lecture.lectureid);
            }
        });
        const currentlyOngoingLecturesString: string = currentlyOngoingLectures.join('&');
        console.log("Lectures Selected:", currentlyOngoingLectures);
        router.push(`/ongoing-lectures/${currentlyOngoingLecturesString}`);
    };

    function actualDateHereNowAndJustTheDate(): Date
    {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        const formattedDate = formatter.format(new Date());
        const finalDate = new Date(formattedDate + 'T00:00:00.000Z');
        console.log(`Trial ${finalDate}`)
        return finalDate;
        // const time =    
        // const date = new Date(`${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}`);
        // date.setHours(5, 30, 0, 0);
        // // 5:30 am today -> ISO String -> 00:00 today
        // return date;
    }

    function sortLectures(lectureList: Lecture[]): void
    {
        lectureList.sort((a, b) => {
            const t1 = new Date(a.starttime);
            const t2 = new Date(b.starttime);
            if (t1 < t2) return -1;
            if (t1 > t2) return 1;

            if (a.batchid < b.batchid) return -1;
            if (a.batchid > b.batchid) return 1;

            return 0;
        });
    }

    function formatTime(time: string): string
    {
        const formatted_time: string = time.split(/[T.]/)[1];
        return formatted_time.slice(0, -3);
    }

    function add5hours30minutes (date: Date): Date
    {
        const noOfMillisecondsIn5hours30minutes = 5.5 * 60 * 60 * 1000;
        return new Date(date.getTime() + noOfMillisecondsIn5hours30minutes);
    }

    function setDateToUnixEpoch(date: Date): Date
    {
        date.setFullYear(1970, 0, 1);
        return date;
    }
    
    function currentlyOngoing(lecture: Lecture): boolean
    {
        const starttime = new Date(lecture.starttime);
        const endtime = new Date(lecture.endtime);
        const currenttime = setDateToUnixEpoch(add5hours30minutes(new Date()));

        return ((starttime <= currenttime) && (currenttime <= endtime));
    }

    return (
        errorScenario ? 
        (<div className="server-error">
            <img className="server-error-image" src={qiqi_fallen.src}></img>
            <p className='lecture-page'>Error fetching lectures</p>
            <p className='lecture-page'>This could be an internal server error, please try refreshing the page</p>
        </div>) :
        (<div className="lecture-list">
            <h1 className='lecture-page'>{days[today.getDay()]}'s Lecture List</h1>
            {
                loadedLectures ? (listOfLectures.length > 0 ?
                <>
                    {listOfLectures.some(lecture => currentlyOngoing(lecture)) &&
                    <motion.button
                        className="all-ongoing-lectures-button"
                        onClick={() => fetchMultipleLecturesAttendanceRequests()}
                        initial={{ opacity: 0, scale: 1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        View Requests For All <br></br> Ongoing Lectures
                    </motion.button>
                    }
                    {listOfLectures.map((lecture, index) =>
                        <div key={`${lecture.lectureid}`} className="lecture-button-ongoing-text-container">
                            <motion.button
                                key={`${lecture.lectureid}`}
                                className={(currentlyOngoing(lecture)) ? 'ongoing-lecture-button' : 'lecture-button'}
                                onClick={() => fetchAttendanceRequests(`${lecture.lectureid}`)}
                                initial={{ opacity: 0, scale: 1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                {lecture.Module.course_name} 
                                <br/>
                                {lecture.batchid} ({formatTime(lecture.starttime)}-{formatTime(lecture.endtime)})
                            </motion.button>
                            {currentlyOngoing(lecture) && <motion.p className="currently-ongoing-text">Currently Ongoing</motion.p>}
                        </div>
                    )}
                </> :
                <div className="no-lectures">
                    <img className="no-lectures-image" src={keqing_sleeping.src}></img>
                    <p className='lecture-page'>You have no lectures today</p>
                    <p className='lecture-page'>Take rest!</p>
                </div>) : 
                <div className="loader"></div>
            }
        </div>)
    );
};

export default TeacherProfile;
