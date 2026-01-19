import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Search from "@/components/Search";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI PM Research - Daily Updates",
  description: "Daily research updates on AI product management, companies, and industry trends",
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
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-white">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <div className="sticky top-0 z-10 bg-white/98 backdrop-blur-md border-b border-[#e5e7eb] px-8 py-5">
              <Search />
            </div>
            <div className="max-w-3xl mx-auto px-8 py-12">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

