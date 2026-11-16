import type { Metadata } from "next";
import { Archivo, Source_Serif_4, JetBrains_Mono } from "next/font/google";

import { PRODUCT_DESCRIPTION, PRODUCT_MARK, PRODUCT_NAME } from "@/shared/brand";
import { publicSiteOrigin } from "@/shared/site-origin";

import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteOrigin()),
  applicationName: PRODUCT_NAME,
  icons: { icon: PRODUCT_MARK },
  title: {
    default: PRODUCT_NAME,
    template: `%s | ${PRODUCT_NAME}`,
  },
  description: PRODUCT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: PRODUCT_NAME,
    title: PRODUCT_NAME,
    description: PRODUCT_DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
