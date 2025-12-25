'use client';

import React, { useEffect, useState } from "react";

import { useSession, signIn, signOut } from "next-auth/react"

//// To be changed

const Component = () => {
  const { data: session } = useSession()
  if (session) {
    return (
      <>
        Signed in as {session?.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }
  
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn("credentials", {
        universityid,
        password,
        callbackUrl: "/"
      })}>
        Sign in
      </button>
    </>
  )
}

export default Component;