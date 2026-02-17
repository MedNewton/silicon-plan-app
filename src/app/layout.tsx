import "@/styles/globals.css";
import type { Metadata } from "next";
import { Sora } from "next/font/google";
import ThemeRegistry from "@/components/layout/ThemeRegistry";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/layout/ToastProvider";
import LanguageProvider from "@/components/i18n/LanguageProvider";


export const metadata: Metadata = {
  title: "SiliconPlan - AI-Powered Business Planning App",
  description:
    "Empowering businesses worldwide with AI-driven tools for business planning, financial forecasting, and investor-ready insights.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const sora = Sora({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={sora.variable}>
      <body>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          signInUrl="/auth"
          signUpUrl="/auth"
        >
          <LanguageProvider>
            <ThemeRegistry>
              <ToastProvider />
              {children}
            </ThemeRegistry>
          </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
