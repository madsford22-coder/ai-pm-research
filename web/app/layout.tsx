import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Search from "@/components/Search";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Madison's Morning Memo",
  description: "A daily PM research digest on applied AI — signals over noise, with a special eye on women in tech. By Madison Ford.",
  alternates: {
    types: {
      'application/rss+xml': '/rss.xml',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="flex min-h-screen bg-[#faf8f5] dark:bg-[#18160f] overflow-x-hidden">
          <Sidebar />
          <main className="flex-1 lg:ml-64 min-w-0">
            <div className="sticky top-0 z-10 bg-[#faf8f5]/90 dark:bg-[#18160f]/90 backdrop-blur-xl border-b border-[#e7e3dd] dark:border-[#2e2b24] px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <Link
                  href="/"
                  className="lg:hidden flex-shrink-0 p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  aria-label="Home"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </Link>
                <div className="flex-1 max-w-2xl min-w-0">
                  <Search />
                </div>
                <ThemeToggle />
              </div>
            </div>
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

