import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MT4 EA Profit Filter",
  description: "Phân tích và lọc profit giao dịch từ MT4 Statement theo EA Comment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
                  <Header />
                  <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
                    {children}
                  </main>
                  <footer className="border-t py-6 px-8 text-center text-xs text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} MT4 EA Profit Filter Dashboard. All rights reserved.</p>
                  </footer>
                </div>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
