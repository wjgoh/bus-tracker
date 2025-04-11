"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { VehicleDataFetcher } from "@/api/gtfs_realtime";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <VehicleDataFetcher />
      {children}
    </body>
  );
}
