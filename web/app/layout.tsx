import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Search from "@/components/Search";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI PM Research Hub",
  description: "Your daily dose of AI product insights, practical patterns, and PM takeaways from the evolving world of AI tools and workflows",
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
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-x-hidden">
          <Sidebar />
          <main className="flex-1 lg:ml-64 min-w-0">
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
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

