import React, { useState, useRef } from "react";
import { AnimatePresence, easeInOut, motion } from 'framer-motion';
import { Student } from "@prisma/client";
import kaeya_shrug from '../images/kaeya-shrug.png';
import venti_happy from '../images/venti-happy.png';

interface ConfirmationPopupProps {
  isPopupOpen: boolean;
  closePopup: () => void;
  letter: boolean;
  studentsExtractedFromLetter?: Student[];
  studentsManuallyAddedWithLetter?: Student[];
  noLetterStudents?: Student[];
  extractedDates?: Date[];
  manuallyAddedDates?: Date[];
  noLetterDates?: Date[];
  submitFunction: () => Promise<number>;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({ isPopupOpen, closePopup, letter, studentsExtractedFromLetter, studentsManuallyAddedWithLetter, noLetterStudents, extractedDates, manuallyAddedDates, noLetterDates, submitFunction }) => {
    console.log(studentsExtractedFromLetter, studentsManuallyAddedWithLetter, noLetterStudents);
    console.log(extractedDates, manuallyAddedDates, noLetterDates);
    const NOT_SUBMITTED = 0;
    const SUBMITTING = 1;
    const SUCCESSFUL = 2;
    const ERROR = 3;
    const [stateOfSubmission, setStateOfSubmission] = useState<number>(NOT_SUBMITTED);

    const submitter = async () => {
        try
        {
            setStateOfSubmission(SUBMITTING);
            const response_num = await submitFunction();
            if(response_num === 200)
            {
                setStateOfSubmission(SUCCESSFUL);
            }
            else
            {
                setStateOfSubmission(ERROR);
            }
        }
        catch
        {
            setStateOfSubmission(ERROR);
        }
    }

    if(!((Array.isArray(studentsExtractedFromLetter) || Array.isArray(studentsManuallyAddedWithLetter) || Array.isArray(noLetterStudents))
        &&
        (Array.isArray(extractedDates) || Array.isArray(manuallyAddedDates) || Array.isArray(noLetterDates)))
    ) {
        return null;
    }

    extractedDates?.sort((a: Date, b: Date) => a.getTime() - b.getTime());
    manuallyAddedDates?.sort((a: Date, b: Date) => a.getTime() - b.getTime());
    noLetterDates?.sort((a: Date, b: Date) => a.getTime() - b.getTime());

    const formattedDate = (date: Date): string => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    return (
        <AnimatePresence>
            {stateOfSubmission === NOT_SUBMITTED ? <>{isPopupOpen &&
            <motion.div
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
            >
                <div className="overlay" onClick={closePopup}></div>
                <div className="popup">
                    <button className="close-popup" onClick={closePopup}>✖</button>
                    {letter ? 
                    <div className="popup-content popup-content-letter">
                        <h2 className='are-you-sure'>Are you sure you want to submit these names with the attached letter?</h2>
                        {(studentsExtractedFromLetter!.length > 0) && 
                        <div className='names-from-the-letter'>
                            {/* <h2 className='confirmation-table-title extracted-names'>Names we were able to extract from the letter</h2> */}
                            <table className='confirmation-table extracted-names'>
                                <thead>
                                    <tr>
                                        <th>Extracted from the letter</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsExtractedFromLetter!.map(student => 
                                        (<tr key={student.sapid}>
                                            <td>{student.name}</td>
                                        </tr>)
                                    )}
                                </tbody>
                            </table>
                        </div>
                        }
                        {(studentsManuallyAddedWithLetter!.length > 0) && 
                        <div className='names-added-with-the-letter'>
                            {/* <h2 className='confirmation-table-title added-names'>Names manually added to the list</h2> */}
                            <table className='confirmation-table added-names'>
                                <thead>
                                    <tr>
                                        <th>Manually added to the list</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsManuallyAddedWithLetter!.map(student => 
                                        (<tr key={student.sapid}>
                                            <td>{student.name}</td>
                                        </tr>)
                                    )}
                                </tbody>
                            </table>
                        </div>
                        }
                        {(studentsManuallyAddedWithLetter!.length > 0) && 
                        <div className='warning yellow-warning'>
                            Manually added names could not be detected by the model and will be distinctly highlighted
                        </div>}
                        <div className="letter-dates-confirmation">
                            The request will be made for <br></br>
                            {extractedDates!.length > 0 && <>The following dates extracted from the letter: <div className="extracted-ones">{extractedDates!.map((date: Date) => formattedDate(date)).join(', ')}</div></>}
                            {manuallyAddedDates!.length > 0 && <>The following dates added manually: <div className="added-ones">{manuallyAddedDates!.map((date: Date) => formattedDate(date)).join(', ')}</div></>}
                            Rest assured, everything will be handled by itself
                        </div>
                        <div className="final-info">
                            On sending this request, your attached images will be publicly visible until they are deleted. 
                            Please ensure you consent to making your request and attached media files visible to everyone before submitting.
                        </div>
                        <button className='btn hyper-final-submit' onClick={() => {submitter()}}>Submit Requests</button>
                    </div> : 
                    <div className="popup-content popup-content-no-letter">
                        <h2 className='are-you-sure'>Are you sure you want to submit these names without any letter attached?</h2>
                        {(noLetterStudents!.length > 0) &&
                        <div className='names-not-associated-with-a-letter'>
                            {/* <h2 className='confirmation-table-title no-letter-names'>Names not associated with any letter</h2> */}
                            <table className='confirmation-table no-letter-names'>
                                <thead>
                                    <tr>
                                        <th>Names not associated with any letter</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {noLetterStudents!.map(student => 
                                        (<tr key={student.sapid}>
                                            <td>{student.name}</td>
                                        </tr>)
                                    )}
                                </tbody>
                            </table>
                        </div>
                        }
                        {(noLetterStudents!.length > 0) && 
                        <div className='warning red-warning'>
                            No letter is attached with these names. Please ensure that your reason is genuine, clearly conveyed and known about by the teachers
                            <br></br>
                            <b>If you have a letter or any other valid image proof, please attach it.</b>
                        </div>}
                        <div className="no-letter-dates-confirmation">
                            The request will be made for the following dates: <br></br>{noLetterDates!.map((date: Date) => formattedDate(date)).join(', ')}
                            <br></br>
                            Rest assured, everything will be handled by itself
                        </div>
                        <div className="final-info">
                            On sending this request, your attached images will be publicly visible until they are deleted. 
                            Please ensure you consent to making your request and attached media files visible to everyone before submitting.
                        </div>
                        <button className='btn hyper-final-submit' onClick={() => {submitter()}}>Submit Requests</button>
                    </div>
                    }
                </div>
            </motion.div>}</> : 

            stateOfSubmission === SUBMITTING ? 
            <motion.div>
                <div className="overlay"></div>
                <div className="popup">
                    <button className="close-popup" onClick={closePopup}>✖</button>
                    <div className="popup-content loader-div">
                        <div className="loader"></div>
                    </div>
                </div>
            </motion.div> : 

            stateOfSubmission === SUCCESSFUL ?
            <motion.div>
                <div className="overlay" onClick={closePopup}></div>
                <div className="popup">
                    <button className="close-popup" onClick={closePopup}>✖</button>
                    <div className="popup-content successfully-submitted">
                        <img className="post-success-image" src={venti_happy.src}></img>
                        <h2 className='final-success-or-error-message'>Successfully submitted attendance requests!</h2>
                    </div>
                </div>
            </motion.div> :

            stateOfSubmission === ERROR ?
            <motion.div>
                <div className="overlay" onClick={closePopup}></div>
                <div className="popup">
                    <button className="close-popup" onClick={closePopup}>✖</button>
                    <div className="popup-content could-not-submit">
                        <img className="post-failure-image" src={kaeya_shrug.src}></img>
                        <h2 className='final-success-or-error-message'>Sorry, there was an error submitting the requests. Please try again</h2>
                        <button className='btn hyper-final-submit' onClick={() => {submitter()}}>Retry</button>
                    </div>
                </div>
            </motion.div> :
         
            <></>
        }

        </AnimatePresence>
    );
}

export default ConfirmationPopup;
