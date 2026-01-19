import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Search from "@/components/Search";

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
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-8 py-4 shadow-sm">
              <Search />
            </div>
            <div className="max-w-4xl mx-auto px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

