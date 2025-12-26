'use client';

import React, { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react"
import bcrypt from "bcryptjs";
import { PageStatus, EmailStatus, OtpStatus } from "@/enums/errors-and-statuses";
import { PasswordConstraints } from "@/enums/password-constraints";
import { Dancing_Script, Playwrite_IT_Moderna } from "next/font/google";
import { useRouter } from "next/navigation";
import ganyu_happy from '@/images/webp/ganyu-happy.webp'
import '@/app/styles/HomePage.css';
import '@/app/styles/SignInLoader.css';

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

const plwrtITModerna = Playwrite_IT_Moderna({
  variable: "--font-dancing-script"
});

const SignUp = () => {
  const { data: session, status } = useSession();
  const [universityId, setUniversityId] = useState<string>('');
  const [pageState, setPageState] = useState<PageStatus>(PageStatus.BASE_PAGE);
  const [otpStatus, setOtpStatus] = useState<OtpStatus>(OtpStatus.NO_ERROR);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>(EmailStatus.NO_ERROR);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');
  const [userConfirmationPassword, setUserConfirmationPassword] = useState<string>('');
  const [lowercaseLetterConstraintMet, setLowercaseLetterConstraintMet] = useState<boolean>(false);
  const [uppercaseLetterConstraintMet, setUppercaseLetterConstraintMet] = useState<boolean>(false);
  const [numberConstraintMet, setNumberConstraintMet] = useState<boolean>(false);
  const [specialCharacterConstraintMet, setSpecialCharacterConstraintMet] = useState<boolean>(false);
  const [lengthConstraintMet, setLengthConstraintMet] = useState<boolean>(false);
  const [allPasswordConstraintsMet, setAllPasswordConstraintsMet] = useState<boolean>(false);
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [submissionState, setSubmissionState] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setLowercaseLetterConstraintMet(
      checkPasswordConstraint(userPassword, PasswordConstraints.LOWERCASE_LETTER)
    );
    setUppercaseLetterConstraintMet(
      checkPasswordConstraint(userPassword, PasswordConstraints.UPPERCASE_LETTER)
    );
    setNumberConstraintMet(
      checkPasswordConstraint(userPassword, PasswordConstraints.NUMBER)
    );
    setSpecialCharacterConstraintMet(
      checkPasswordConstraint(userPassword, PasswordConstraints.SPECIAL_CHARACTER)
    );
    setLengthConstraintMet(
      checkPasswordConstraint(userPassword, PasswordConstraints.MINIMUM_8_CHARACTERS)
    );
  }, [userPassword]);


  useEffect(() => {
    setAllPasswordConstraintsMet(
      lowercaseLetterConstraintMet && 
      uppercaseLetterConstraintMet && 
      numberConstraintMet && 
      specialCharacterConstraintMet && 
      lengthConstraintMet
    );
  }, [lowercaseLetterConstraintMet, uppercaseLetterConstraintMet, numberConstraintMet, specialCharacterConstraintMet, lengthConstraintMet]);


  function handlePasswordVisibility() {
    setPasswordVisible((prev) => !prev)
  }

  function checkOtpPattern(otp: string): boolean {
    return /\d{6}/.test(otp.trim());
  }


  function checkPasswordConstraint(password: string, constraint: PasswordConstraints): boolean {
    switch (constraint) {
      case PasswordConstraints.LOWERCASE_LETTER:
        return /[a-z]/.test(password);
      case PasswordConstraints.UPPERCASE_LETTER:
        return /[A-Z]/.test(password);
      case PasswordConstraints.NUMBER:
        return /[0-9]/.test(password);
      case PasswordConstraints.SPECIAL_CHARACTER:
        return /[!@#$%^&*(),.?":{}|<>_\-+=~[\]\\;/]/.test(password);
      case PasswordConstraints.MINIMUM_8_CHARACTERS:
        return password.length >= 8;
    }
  }
  
  async function sendEmail(): Promise<boolean> {
    try {
      setEmailStatus(EmailStatus.NO_ERROR);
      setPageState(PageStatus.BASE_PAGE);

      const response = await fetch('/api/auth/send-email-for-password-change', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ universityId: universityId.trim() })
      })
      
      const result = await response.json();

      if (response.status === 200) {
        if (result.success) {
          setPageState(PageStatus.EMAIL_SENT);
          setEmailStatus(EmailStatus.NO_ERROR);
          return true;
        }
        else {
          setPageState(PageStatus.EMAIL_ERROR);
          setEmailStatus(EmailStatus.USER_HAS_NO_EMAIL);
          return false;
        }
      }
      else {
        setPageState(PageStatus.EMAIL_ERROR);
        setEmailStatus(result.errorType || EmailStatus.OTHER);
        return false;
      }
    }
    catch (err) {
      setPageState(PageStatus.EMAIL_ERROR);
      setEmailStatus(EmailStatus.OTHER);
      return false;
    }
  }

  async function checkEnteredOtp() {
    try {
      setOtpStatus(OtpStatus.NO_ERROR);
      const params = new URLSearchParams();
  
      params.append('universityid', universityId.trim());
      params.append('enteredOtp', enteredOtp.trim());
      
      const response = await fetch(`api/auth/verify-otp?${params.toString()}`, {
        method: 'GET'
      });
  
      const result = await response.json();
  
      if (response.status === 200) {
        if (result.success) {
          setPageState(PageStatus.OTP_VERIFIED);
          setOtpStatus(OtpStatus.NO_ERROR);
        }
        else {
          setPageState(PageStatus.OTP_ERROR);
          setOtpStatus(OtpStatus.OTP_INVALID);
        }
      }
      else {
        setPageState(PageStatus.OTP_ERROR);
        setOtpStatus(result.errorType || OtpStatus.OTHER);
      }
    }
    catch (err) {
      setPageState(PageStatus.OTP_ERROR);
      setOtpStatus(OtpStatus.OTHER);
    }
  }

  async function submitPassword() {
    setPageState(PageStatus.OTP_VERIFIED);

    const passwordHash = await bcrypt.hash(userPassword, 10);
    
    const response = await fetch(`api/auth/set-password`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ universityId: universityId, newPasswordHash: passwordHash })
    });

    const result = await response.json();

    if (response.status === 200) {
      if (result.success) {
        setPageState(PageStatus.PASSWORD_CHANGED);
      }
      else {
        setPageState(PageStatus.PASSWORD_CHANGE_FAILED);
      }
    }
    else {
      setPageState(PageStatus.PASSWORD_CHANGE_FAILED);
    }
  }

  async function functionPerformer(callback: (() => Promise<boolean>) | (() => Promise<void>)) {
    setSubmissionState(true);
    await callback();
    setSubmissionState(false);
  }


  if (status === 'loading') {
    <div className="loader-div">
      <div className="loader"></div>
    </div>
  }
  else if (session) {
    return (
      <>
        <div className="m-4 flex flex-col gap-4">
          <div className="text-center">
            <h1 className={`home-page title ${dancingScript.className}`}>CHARM</h1>
          </div>
          <div>
            Signed in as {
                session.user.name ? `${session.user.name}` : `${session.user.universityid}`
            } <br />
            {/* University ID: {session.user?.universityid} <br /> */}

            <div className='table-div-container'>
                <div className='table-div'>
                    <table className='user-details-table'>
                    <tbody>
                        <tr>
                        <td><b>University ID</b></td>
                        <td>{session.user.universityid}</td>
                        </tr>
                        {session.user.name && <tr>
                        <td><b>Name</b></td>
                        <td>{session.user.name}</td>
                        </tr>}
                        {session.user.email && <tr>
                        <td><b>Email</b></td>
                        <td>{session.user.email}</td>
                        </tr>}
                    </tbody>
                    </table>
                </div>
            </div>
          </div>
          <div className="flex flex-row justify-between max-w-96">
            <div className="text-blue-600">
                <a href="/" className="text-blue-600 visited:text-blue-600">Go to home page</a>
            </div>
            <button className="text-base bg-red-600 text-white p-1 w-20 rounded-full active:bg-red-800" onClick={() => signOut()}>
                Sign out
            </button>
          </div>
        </div>
      </>
    )
  }
  else {
    return (
      <>
        <div className="m-4">
          <div className="text-center">
            <h1 className={`home-page title ${dancingScript.className}`}>CHARM</h1>
          </div>
          {
            <div className="p-2 flex flex-col gap-4 justify-center text-base">
              <div className="flex flex-col gap-2 justify-center text-base">
                {
                  (pageState === PageStatus.BASE_PAGE || pageState === PageStatus.EMAIL_ERROR) ? 
                  <>
                    <div className="p-2 justify-center text-center text-lg">
                      Change your password <br />
                    </div>
                    <label className="text-base" htmlFor="universityid">Enter your University ID</label>
                    <input
                      type="text"
                      id="universityid"
                      value={universityId}
                      onChange={(e) => setUniversityId(e.target.value)}
                      placeholder="SAP ID or Faculty ID"
                      className={
                        `p-2 border-2 rounded-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-300 
                        `
                        // ${universityIdError ? `border-red-600 ` : `border-blue-600 `}
                      }
                    />
                    {/* <label className="text-base" htmlFor="universityid">Enter the Email ID associated with it</label>
                    <input
                      type="text"
                      id="universityid"
                      value={universityId}
                      onChange={(e) => setUniversityId(e.target.value)}
                      placeholder="Registered Email ID"
                      className={
                        `p-2 border-2 rounded-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-300 
                        `
                        // ${universityIdError ? `border-red-600 ` : `border-blue-600 `}
                      }
                    /> */}
                    <div className="flex justify-center">
                      {(pageState === PageStatus.EMAIL_ERROR) && <div className="text-sm text-red-600">
                        {
                          emailStatus === EmailStatus.USER_NOT_FOUND ? 
                          `Sorry, we could not find a registered user with that University ID` :
                          emailStatus === EmailStatus.USER_HAS_NO_EMAIL ? 
                          `Your University Profile is not linked with any Email ID. 
                          Please contact the university officials to update your email address with a desired one, 
                          or contact the creator of this website if this seems to be a mistake.` :
                          emailStatus === EmailStatus.OTHER ? 
                          `An error occurred while sending the email. Please check your internet connection and retry.` : 
                          emailStatus === EmailStatus.NO_ERROR ?
                          `` :
                          `An unexpected error has occurred. Please report this error.`
                        }
                      </div>}
                    </div>
                    <div className="flex justify-end">
                      {!submissionState ? <button className="text-base bg-blue-600 text-white p-1 w-20 rounded-full active:bg-blue-800" onClick={() => functionPerformer(sendEmail)} disabled={universityId.trim() === ''}>
                        Proceed
                      </button> : <div className="sign-in-loader"></div>}
                    </div>
                  </> :
            
            
                  (pageState === PageStatus.EMAIL_SENT || pageState === PageStatus.OTP_ERROR) ? 
                  <>
                    <div className="flex justify-center">
                      We have sent a 6 digit code to your registered email address. If you don't find the mail, please check the spam folder. The OTP is valid for 10 minutes. Please enter it below <br />
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="text"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        className={
                          `p-2 border-2 rounded-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-300 
                          text-center text-xl max-w-96`
                          // ${universityIdError ? `border-red-600 ` : `border-blue-600 `}
                        }
                      />
                    </div>
                    <div className="flex justify-center">
                      {(pageState === PageStatus.OTP_ERROR) && <div className="text-base text-red-600">
                        {
                          otpStatus === OtpStatus.OTP_INVALID ? 
                          `Invalid OTP` :
                          otpStatus === OtpStatus.OTP_EXPIRED ? 
                          `The last OTP requested by you has expired. Please request a new one` :
                          otpStatus === OtpStatus.NO_REQUEST ? 
                          `No OTP requests exist apparently... Strange` :
                          otpStatus === OtpStatus.BAD_REQUEST ? 
                          `Something seems to be missing to verify your OTP. An error worth reporting` :
                          otpStatus === OtpStatus.OTHER ? 
                          `An error occurred while verifying the OTP. Please check your internet connection and retry.` :
                          otpStatus === OtpStatus.NO_ERROR ?
                          `` :
                          `An unexpected error has occurred. Please report this error.`
                        }
                      </div>}
                    </div>
                    <div className="flex justify-center">
                      {!submissionState ? <button className="text-base bg-blue-600 text-white p-1 w-32 rounded-full active:bg-blue-800" onClick={() => functionPerformer(checkEnteredOtp)} disabled={!checkOtpPattern(enteredOtp)}>
                        Check OTP
                      </button> : <div className="sign-in-loader"></div>}
                    </div>
                  </> :
            
            
                  ((pageState === PageStatus.OTP_VERIFIED) || (pageState === PageStatus.PASSWORD_CHANGE_FAILED)) ? 
                  <>
                    <div className="flex">
                      OTP Verified! You can now change your password by entering a new one below. <br/>
                      {/* Passwords must contain atleast 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character, and should be a minimum of 8 characters long. <br/> */}
                    </div>
                    <div className="flex">
                      Enter Password
                    </div>
                    <div className="flex">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className={
                          `p-2 border-2 rounded-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-300 
                          border-blue-600 text-base max-w-96`
                          // ${universityIdError ? `border-red-600 ` : `border-blue-600 `}
                        }
                      />
                    </div>
                    <div className="flex">
                      Confirm Password
                    </div>
                    <div className="flex">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        value={userConfirmationPassword}
                        onChange={(e) => setUserConfirmationPassword(e.target.value)}
                        className={
                          `p-2 border-2 rounded-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-300 
                          border-blue-600 text-base max-w-96`
                          // ${universityIdError ? `border-red-600 ` : `border-blue-600 `}
                        }
                      />
                    </div>
                    <div className="flex flex-row items-center justify-start gap-2">
                      <div className={`h-5 w-5 text-center justify-center items-center border border-blue-600 rounded-md text-sm text-white ${passwordVisible ? `bg-blue-600` : `border-blue-900`} select-none cursor-pointer`} 
                          // style={ consent ? {} : { borderColor: '#006bad' }} 
                          onClick={handlePasswordVisibility}
                      >
                          {passwordVisible ? '✔' : ''}
                      </div>
                      <div className="text-sm text-gray-800">Show Password</div>
                    </div>
                    <div className={`text-base ${uppercaseLetterConstraintMet ? `text-green-600` : `text-red-600`}`}>                 {uppercaseLetterConstraintMet ? '✔' : '✘'}                  At least one uppercase letter </div>
                    <div className={`text-base ${lowercaseLetterConstraintMet ? `text-green-600` : `text-red-600`}`}>                 {lowercaseLetterConstraintMet ? '✔' : '✘'}                  At least one lowercase letter </div>
                    <div className={`text-base ${numberConstraintMet ? `text-green-600` : `text-red-600`}`}>                          {numberConstraintMet ? '✔' : '✘'}                           At least one number </div>
                    <div className={`text-base ${specialCharacterConstraintMet ? `text-green-600` : `text-red-600`}`}>                {specialCharacterConstraintMet ? '✔' : '✘'}                 At least one special character </div>
                    <div className={`text-base ${lengthConstraintMet ? `text-green-600` : `text-red-600`}`}>                          {lengthConstraintMet ? '✔' : '✘'}                           At least 8 characters </div>
                    <div className={`text-base ${(userPassword === userConfirmationPassword) ? `text-green-600` : `text-red-600`}`}>  {(userPassword === userConfirmationPassword) ? '✔' : '✘'}   Passwords match </div>
                    <div className="flex justify-center">
                      {!submissionState ? <button className="text-base bg-blue-600 text-white p-1 w-40 rounded-full active:bg-blue-800" onClick={() => functionPerformer(submitPassword)} disabled={!(allPasswordConstraintsMet && (userPassword === userConfirmationPassword))}>
                        Change Password
                      </button> : <div className="sign-in-loader"></div>}
                    </div>
                    <div className="flex">
                      {(pageState === PageStatus.PASSWORD_CHANGE_FAILED) && <div className="text-base text-red-600">
                        Failed to change your password. This might be due to a server error or loss of internet connection. Please try again. If this error persists, please report it.
                      </div>}
                    </div>
                  </> :
            
            
                  pageState === PageStatus.PASSWORD_CHANGED ? 
                  <>
                    <div className="flex justify-center">
                      Password changed successfully! Please login to your account with the password you just set.
                    </div>
                    <div className="about-image-container">
                      <img className="about-image" src={ganyu_happy.src}></img>
                      <p className="text-lg text-gray-600">Thank you for using CHARM!</p>
                    </div>
                  </> :
            
                  <></>
                }
              </div>
            </div>
          }
        </div>
      </>
    )
  }
}

export default SignUp;