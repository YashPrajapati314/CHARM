import '@/app/styles/HomePage.css';
import { Dancing_Script, Playwrite_IT_Moderna } from 'next/font/google';
import { useRouter } from 'next/navigation';


const plwrtITModerna = Playwrite_IT_Moderna({
  variable: "--font-dancing-script"
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

export const CHARM = () => {
    const router = useRouter();
    return (
        <h1 onClick={() => router.push("/")} className={`home-page title text-center ${dancingScript.className}`}>CHARM</h1>
    );
};

export const MarginedCHARM = () => {
    const router = useRouter();
    return (
        <h1 onClick={() => router.push("/")} className={`charm text-center ${dancingScript.className}`}>CHARM</h1>
    );
};