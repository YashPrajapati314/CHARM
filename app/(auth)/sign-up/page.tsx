'use client';

import React, { useEffect, useState } from "react";

import { useSession, signIn, signOut } from "next-auth/react"
import bcrypt from "bcryptjs";

// enum PageStatus {
//   ERROR = -6,
//   USER_NOT_FOUND = -5,
//   ACCOUNT_ALREADY_EXISTS = -4,
//   OTP_ERROR = -2,
//   USER_HAS_NO_EMAIL = -1,
//   BASE_PAGE = 0,
//   SENT_EMAIL = 1,
//   OTP_CORRECT = 2,
// };

enum PageStatus {
  PASSWORD_CHANGE_FAILED = -3,
  OTP_ERROR = -2,
  EMAIL_ERROR = -1,
  BASE_PAGE = 0,
  EMAIL_SENT = 1,
  OTP_VERIFIED = 2,
  PASSWORD_CHANGED = 3,
  ERROR = -100
};

enum EmailStatus {
  NO_ERROR = 0,
  USER_NOT_FOUND = 1,
  USER_HAS_NO_EMAIL = 2,
  ACCOUNT_ALREADY_EXISTS = 3,
  OTHER = 4
}

enum OtpStatus {
  NO_ERROR = 0,
  OTP_INVALID = 1,
  OTP_EXPIRED = 2,
  NO_REQUEST = 3,
  BAD_REQUEST = 4,
  OTHER = 5
}

enum PasswordConstraints {
  UPPERCASE_LETTER = 0,
  LOWERCASE_LETTER = 1,
  NUMBER = 2,
  SPECIAL_CHARACTER = 3,
  MINIMUM_8_CHARACTERS = 4,
}

const SignUp = () => {
  const { data: session } = useSession();
  const [universityId, setUniversityId] = useState<string>('');
  const [pageState, setPageState] = useState<PageStatus>(PageStatus.BASE_PAGE);
  const [otpStatus, setOtpStatus] = useState<OtpStatus>(OtpStatus.NO_ERROR);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>(EmailStatus.NO_ERROR);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');
  const [lowercaseLetterConstraintMet, setLowercaseLetterConstraintMet] = useState<boolean>(false);
  const [uppercaseLetterConstraintMet, setUppercaseLetterConstraintMet] = useState<boolean>(false);
  const [numberConstraintMet, setNumberConstraintMet] = useState<boolean>(false);
  const [specialCharacterConstraintMet, setSpecialCharacterConstraintMet] = useState<boolean>(false);
  const [lengthConstraintMet, setLengthConstraintMet] = useState<boolean>(false);
  const [allPasswordConstraintsMet, setAllPasswordConstraintsMet] = useState<boolean>(false);

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
  
  async function sendEmail() {
    const response = await fetch('/api/auth/send-email-for-registration', {
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
    }
    return false;
  }

  async function checkEnteredOtp() {
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

  async function submitPassword() {
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


  if (session) {
    return (
      <>
        Signed in as {session?.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }
  else {
    return (
      pageState === PageStatus.BASE_PAGE ? 
      <>
        Create an account <br />
        <label>Enter your University ID (SAP ID or Faculty ID)</label> <br />
        <input
          type="text"
          value={universityId}
          onChange={(e) => setUniversityId(e.target.value)}
        />
        <br />
        <button onClick={() => sendEmail()} disabled={universityId.trim() === ''}>
          Sign in
        </button>
      </> :

      
      pageState === PageStatus.EMAIL_ERROR ? 
      <>
        {
          emailStatus === EmailStatus.USER_NOT_FOUND ? 
          <>
            Create an account <br />
            <label>Enter your University ID (SAP ID or Faculty ID)</label> <br />
            <input
              type="text"
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
            />
            <br />
            <button onClick={() => sendEmail()} disabled={universityId.trim() === ''}>
              Sign in
            </button>
            <br />
            Sorry, we could not find a registered user with that University ID
          </> : 

          emailStatus === EmailStatus.USER_HAS_NO_EMAIL ? 
          <>
            Your University Profile is not linked with any Email ID. 
            Please contact the university officials to update your email address with a desired one, 
            or contact the creator of this website if this seems to be a mistake.
          </> : 

          emailStatus === EmailStatus.ACCOUNT_ALREADY_EXISTS ? 
          <>
            An account has already been created with this University ID. 
            If this is your University ID and this was not done by you, 
            and you don't have access to your account, please contact the creator of this website.
          </> : 

          emailStatus === EmailStatus.OTHER ? 
          <>
            An error occurred while sending the email. Please check your internet connection and retry.
          </> : 

          <>
            An unexpected error has occurred. Please report this error here.
          </>
        }
      </> :


      pageState === PageStatus.EMAIL_SENT ? 
      <>
        We have sent a 6 digit code to your registered email address. The OTP is valid for 10 minutes. Please enter it below <br />
        <input
          type="text"
          value={enteredOtp}
          onChange={(e) => setEnteredOtp(e.target.value)}
        />
        <br />
        <button onClick={() => checkEnteredOtp()} disabled={enteredOtp.trim() === ''}>
          Check OTP
        </button>
      </> :


      pageState === PageStatus.OTP_ERROR ? 
      <>
        {
          otpStatus === OtpStatus.OTP_INVALID ? 
          <>
            We have sent a 6 digit code to your registered email address. The OTP is valid for 10 minutes. Please enter it below <br />
            <input
              type="text"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
            />
            <br />
            <button onClick={() => checkEnteredOtp()} disabled={enteredOtp.trim() === ''}>
              Check OTP
            </button>
            <br />
            Invalid OTP
          </> : 

          otpStatus === OtpStatus.OTP_EXPIRED ? 
          <>
            The last requested OTP for this user has expired. Please request a new OTP.
          </> : 

          otpStatus === OtpStatus.NO_REQUEST ? 
          <>
            No OTP requests exist apparently... Strange
          </> : 

          otpStatus === OtpStatus.BAD_REQUEST ? 
          <>
            Something's seems to be missing to verify your OTP. An error worth reporting
          </> : 

          otpStatus === OtpStatus.OTHER ? 
          <>
            An error occurred while verifying the OTP. Please check your internet connection and retry.
          </> : 

          <>
            An unexpected error has occurred. Please report this error here.
          </>
        }
      </> :


      pageState === PageStatus.OTP_VERIFIED ? 
      <>
        OTP Verified! Please set up your account by setting a password. <br/>
        Passwords must contain atleast 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character, and should be a minimum of 8 characters long. <br/>
        <label>Password: </label>
        <input
          type="password"
          value={userPassword}
          onChange={(e) => setUserPassword(e.target.value)}
        />
        <br/>
        At least one uppercase letter     {uppercaseLetterConstraintMet ? '✔' : '✘'} <br/>
        At least one lowercase letter     {lowercaseLetterConstraintMet ? '✔' : '✘'} <br/>
        At least one number               {numberConstraintMet ? '✔' : '✘'} <br/>
        At least one special character    {specialCharacterConstraintMet ? '✔' : '✘'} <br/>
        At least 8 characters             {lengthConstraintMet ? '✔' : '✘'} <br/>
        <br/>
        <button onClick={() => submitPassword()} disabled={!allPasswordConstraintsMet}>Set Password</button>
      </> :
      

      pageState === PageStatus.PASSWORD_CHANGE_FAILED ? 
      <>
        Failed to create your account. This might be due to a server error. If this error persists, please contact the creator of the website.
      </> :


      pageState === PageStatus.PASSWORD_CHANGED ? 
      <>
        Account created successfully! Please login to your account with the password you just set.
      </> :

      <></>
    )
  }
}

export default SignUp;