import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Interview Coach",
  description: "Practice your interview skills with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
     appearance={{
    layout: {
      logoPlacement: "none",
      showOptionalFields: false,
    },
    elements: {
      // Targets the "Powered by Clerk" text and logo
      internal_b3fm6y: "hidden", 
      rootBox: "font-sans",
      // Hides the footer container entirely
      footer: "hidden",
      // Hides the specific branding link
      branding: "hidden",
    }
  }}
    >
      <html lang="en">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}