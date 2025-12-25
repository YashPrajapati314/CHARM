'use client';

import React, { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react"
import { SignInError } from '@/enums/errors-and-statuses';
import { Dancing_Script, Playwrite_IT_Moderna } from "next/font/google";
import { useRouter } from "next/navigation";
import '@/app/styles/HomePage.css';
import '@/app/styles/SignInLoader.css'

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

const plwrtITModerna = Playwrite_IT_Moderna({
  variable: "--font-dancing-script"
});

const SignIn = () => {
  const { data: session } = useSession()
  const [universityId, setUniversityId] = useState<string>('');
  const [enteredPassword, setEnteredPassword] = useState<string>('');
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [universityIdError, setUniversityIdError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [loadState, setLoadState] = useState<boolean>(false);
  const router = useRouter();

  const handlePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev)
  }

  const trySignIn = async (universityId: string, enteredPassword: string) => {
    setLoadState(true);
    setError('');
    setPasswordError('');
    setUniversityIdError('');

    if (!universityId) {
      setUniversityIdError('Enter a University ID');
    }
    else if (!enteredPassword) {
      setPasswordError('Enter a password');
    }
    else {
      const signInResponse = await signIn("credentials", {
        universityid: universityId,
        password: enteredPassword,
        callbackUrl: "/",
        redirect: false
      })
  
      if (signInResponse?.error) {
        const signInError = signInResponse.error.substring(7);
        // setError(signInError);
        switch(signInError) {
          case SignInError.USER_DOESNT_EXIST:
            setUniversityIdError(signInError);
            break;
          case SignInError.ACCOUNT_NOT_INITIALIZED:
            setUniversityIdError(signInError);
            break;
          case SignInError.INCORRECT_PASSWORD:
            setPasswordError(signInError);
            break;
          default:
            setError(SignInError.UNKNOWN_ERROR);
            break;
        }
        console.log(signInError);
      }
      else {
        window.location.href = "/";
      }
    }
    setLoadState(false);
  }

  if (session) {
    return (
      <>
        <div className="text-center">
          <h1 className={`home-page title ${dancingScript.className}`}>CHARM</h1>
        </div>
        <div className="m-2 flex flex-col gap-2">
          <div>
            Signed in as {
              (session?.user?.name && session?.user?.email) ? `${session?.user?.name} (${session?.user?.email})` :
              session?.user?.name ? session?.user?.name :
              session?.user?.email ? session?.user?.email :
              ''
            } <br />
            {/* University ID: {session.user?.universityid} */}
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
        <div className="text-center">
          <h1 className={`home-page title ${dancingScript.className}`}>CHARM</h1>
        </div>
        <div className="m-2">
          <div className="p-2 justify-center text-center text-lg">
            Sign in to your account <br />
            <div className="justify-center text-center text-sm">
              Don't have an account? <span className="text-blue-600"><a href="/sign-up" className="text-blue-600 visited:text-blue-600">Sign up instead</a></span> <br />
            </div>
          </div>
          <div>
            <div className="p-2 flex flex-col gap-4 justify-center text-base">
              <div className="flex flex-col gap-2 justify-center text-base">
                <label className="text-base" htmlFor="universityid">University ID</label>
                <input
                  type="text"
                  id="universityid"
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  placeholder="SAP ID or Faculty ID"
                  className={
                    `p-2 border-2 rounded-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-300 
                    ${universityIdError ? `border-red-600 ` : `border-blue-600 `}
                    `
                  }
                />
                {universityIdError && <div className="text-sm text-red-600">{universityIdError}</div>}
              </div>
              <div className="flex flex-col gap-2 justify-center text-base">
                <label className="text-base" htmlFor="password">Password</label>
                <input
                  id="password"
                  type={passwordVisible ? "text" : "password"}
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                  placeholder="Password"
                  className={
                    `p-2 border-2 rounded-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-300 
                    ${passwordError ? `border-red-600 ` : `border-blue-600 `}
                    `
                  }
                />
                {passwordError && <div className="text-sm text-red-600">{passwordError}</div>}
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
              <div className="text-sm text-blue-600">
                <a href="/reset-password" className="text-blue-600 visited:text-blue-600">Forgot Password?</a>
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex justify-end">
                {!loadState ? <button className="text-base bg-blue-600 text-white p-1 w-20 rounded-full active:bg-blue-800" onClick={() => trySignIn(universityId, enteredPassword)}>
                  Sign in
                </button> : <div className="sign-in-loader"></div>}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
}

export default SignIn;