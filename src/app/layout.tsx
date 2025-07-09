import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NotificationsProvider } from "@/components/NotificationsContext";
import { AuthProvider } from "@/components/SimpleAuthContext";
import { AvisoModal } from "@/components/AvisoModal";
import { ExpressMessageProvider } from "@/components/ExpressMessageContext";
import { DialogExpresso } from "@/components/DialogExpresso";
import { ExpressMessageManager } from "@/components/ExpressMessageManager";
import { AuthGate } from "@/components/AuthGate";
import { NextAuthProvider } from "@/components/NextAuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iChat - Expresso",
  description: "iChat - Expresso",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        <ThemeProvider>
          <NextAuthProvider>
            <ExpressMessageProvider>
              <NotificationsProvider>
                <AvisoModal />
                <DialogExpresso />
                <ExpressMessageManager />
                <AuthGate />
                {children}
                <Toaster position="bottom-center" />
              </NotificationsProvider>
            </ExpressMessageProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
