'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react"

const Component = () => {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, []);

  return null;
}

export default Component;