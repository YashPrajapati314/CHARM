import { useState } from "react";
import { Menu } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Dancing_Script, Playwrite_IT_Moderna } from "next/font/google";

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

const plwrtITModerna = Playwrite_IT_Moderna({
  variable: "--font-dancing-script"
});

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="title-button-side-by-side">
      <button className="hamburger-menu" onClick={() => setIsMenuOpen(true)}>
        <Menu size={32} />
      </button>

      <h1 className={`home-page title ${dancingScript.className}`}>CHARM</h1>

      <button
        className="btn view-requests-button"
        onClick={() => router.push("/teacher-view")}
      >
        View requests as a teacher
      </button>

      <div className={`sidebar ${isMenuOpen ? "open" : ""}`}>
        <button className="close-menu" onClick={() => setIsMenuOpen(false)}>
          ✖
        </button>
        <button className="sidebar-view-requests-button" onClick={() => router.push("/teacher-view")}>
          View requests as a teacher
        </button>
      </div>

      {isMenuOpen && <div className="overlay" onClick={() => setIsMenuOpen(false)}></div>}
    </div>
  );
};

export default Header;
