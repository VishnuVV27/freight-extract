import type { Metadata } from "next";
import { DM_Mono, Instrument_Sans, Schibsted_Grotesk } from "next/font/google";
import { Shell } from "@/components/Shell";
import { DocsProvider } from "@/lib/DocsContext";
import "./globals.css";

const schibsted = Schibsted_Grotesk({ subsets: ["latin"], weight: "700", variable: "--font-schibsted", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-instrument", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dmmono", display: "swap" });

// Sets the saved mode before first paint so the page never flashes the wrong one
const MODE_SCRIPT = `try{var h=+localStorage.getItem("fx-hue");if(h<0){document.documentElement.dataset.accent="black";document.documentElement.style.setProperty("--hue",250)}else if(h<=360&&localStorage.getItem("fx-hue"))document.documentElement.style.setProperty("--hue",h);var m=localStorage.getItem("fx-mode");if(m==="light"||m==="dark")document.documentElement.dataset.mode=m}catch(e){}`;

export const metadata: Metadata = {
  title: "Freight Extract: read rate confirmations, BOLs and invoices",
  description: "Upload freight PDFs, check only the fields the model is unsure about, and export clean CSV or JSON.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${schibsted.variable} ${instrument.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      <body>
        <DocsProvider>
          <Shell>{children}</Shell>
        </DocsProvider>
      </body>
    </html>
  );
}
