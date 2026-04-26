import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitnessLabs",
  description: "AI-powered nutrition and training tracker",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitnessLabs",
    startupImage: "/apple-touch-icon.png",
  },
  startupImage: [
    {
      url: "/splash/iphone16promax.png",
      media:
        "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)",
    },
    {
      url: "/splash/iphone16pro.png",
      media:
        "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)",
    },
    {
      url: "/splash/iphone16.png",
      media:
        "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
    },
    {
      url: "/splash/iphone15promax.png",
      media:
        "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
    },
    {
      url: "/splash/iphonese.png",
      media:
        "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
    },
  ],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
