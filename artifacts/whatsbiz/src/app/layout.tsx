import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "WhatsBiz AI",
  description: "WhatsApp AI automation for Indian businesses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
