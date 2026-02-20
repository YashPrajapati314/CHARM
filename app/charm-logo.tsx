import '@/app/styles/HomePage.css';
import { Dancing_Script, Playwrite_IT_Moderna } from 'next/font/google';


const plwrtITModerna = Playwrite_IT_Moderna({
  variable: "--font-dancing-script"
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

export const CHARM = () => {
    return (
        <h1 className={`home-page title ${dancingScript.className}`}>CHARM</h1>
    );
};

export const MarginedCHARM = () => {
    return (
        <h1 className={`charm ${dancingScript.className}`}>CHARM</h1>
    );
};