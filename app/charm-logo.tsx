'use client'

import '@/app/styles/HomePage.css';
import { useState } from 'react';
import { Dancing_Script, Playwrite_IT_Moderna } from 'next/font/google';
import { useRouter, usePathname } from 'next/navigation';


const plwrtITModerna = Playwrite_IT_Moderna({
    variable: "--font-dancing-script"
});

const dancingScript = Dancing_Script({
    variable: "--font-dancing-script",
    subsets: ["latin"],
});


const ConfirmOverlay = ({
    onConfirm,
    onCancel,
}: {
    onConfirm: () => void;
    onCancel: () => void;
}) => {
    return (
        <div
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white p-6 rounded-xl shadow-lg text-center space-y-4"
            >
                <p className="text-lg font-semibold">Return to Home Page?</p>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-base bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
                    >
                        Yes
                    </button>

                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-base bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    );
};

export const CHARM = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleClick = () => {
        if (pathname === '/') {
            return;
        }
        else {
            setShowConfirm(true);
        }
    }

    return (
        <>
            <h1
                onClick={() => handleClick()}
                className={`home-page title text-center cursor-pointer ${dancingScript.className}`}
            >
                CHARM
            </h1>

            {showConfirm && (
                <ConfirmOverlay
                    onConfirm={() => router.push("/")}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
        </>
    );
};

export const MarginedCHARM = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleClick = () => {
        if (pathname === '/') {
            return;
        }
        else {
            setShowConfirm(true);
        }
    }

    return (
        <>
            <h1
                onClick={() => handleClick()}
                className={`charm text-center cursor-pointer ${dancingScript.className}`}
            >
                CHARM
            </h1>

            {showConfirm && (
                <ConfirmOverlay
                    onConfirm={() => router.push("/")}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
        </>
    );
};