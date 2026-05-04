import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { StoreHydrator } from "@/components/StoreHydrator";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { HydrationMarker } from "@/components/HydrationMarker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MetaTrader Report Analyzer",
  description: "Institutional-grade trading performance analysis for MetaTrader 4 and 5.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('settings-storage');
                  if (stored) {
                    var parsed = JSON.parse(stored);
                    var lang = parsed.state && parsed.state.language;
                    if (lang === 'vi') {
                      document.documentElement.classList.add('lang-vi');
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientProviders>
            <HydrationMarker />
            <div className="min-h-screen bg-background">
              <TooltipProvider>
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset>
                    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
                      <Header />
                      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
                        <StoreHydrator>
                          {children}
                        </StoreHydrator>
                      </main>
                      <footer className="border-t py-6 px-8 text-center text-xs text-muted-foreground">
                        <p>&copy; {new Date().getFullYear()} MetaTrader Report Analyzer. All rights reserved.</p>
                      </footer>
                    </div>
                  </SidebarInset>
                </SidebarProvider>
              </TooltipProvider>
            </div>
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
