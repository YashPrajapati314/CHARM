import type { Metadata } from "next";
import { Geist, Geist_Mono, Dancing_Script } from "next/font/google";
import "./globals.css";
import kaeya_shrug from '@/images/webp/kaeya-shrug.webp'
import venti_happy from '@/images/webp/venti-happy.webp'
import AuthProvider from "@/context/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Centralized Home for Attendance Request Management",
  description: "View and make attendance requests for your lectures easily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <AuthProvider>
        <head>
          <link rel="preload" as="image" href={kaeya_shrug.src}></link>
          <link rel="preload" as="image" href={venti_happy.src}></link>
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} antialiased`}
        >
          {children}
        </body>
      </AuthProvider>
    </html>
  );
}
