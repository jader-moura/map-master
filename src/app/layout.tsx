import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://buildop.app";
const TITLE = "buildop — Guild Wars 2 Map & World Boss Timer";
const DESCRIPTION =
  "buildop is a free Guild Wars 2 companion: a live world boss timer with countdowns and spawn alerts, plus an interactive Tyria map showing waypoints, vistas, points of interest, renown hearts, hero challenges and portals.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · buildop",
  },
  description: DESCRIPTION,
  applicationName: "buildop",
  keywords: [
    "Guild Wars 2",
    "GW2",
    "GW2 map",
    "Guild Wars 2 map",
    "GW2 interactive map",
    "Tyria map",
    "GW2 boss timer",
    "Guild Wars 2 boss timer",
    "GW2 world boss timer",
    "world boss timer",
    "GW2 boss map",
    "boss map",
    "GW2 world boss schedule",
    "GW2 waypoints",
    "GW2 vistas",
    "GW2 renown hearts",
    "GW2 hero points",
    "GW2 events",
  ],
  authors: [{ name: "buildop" }],
  creator: "buildop",
  publisher: "buildop",
  category: "games",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "buildop",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "buildop",
  url: SITE_URL,
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript",
  description: DESCRIPTION,
  inLanguage: "en",
  isAccessibleForFree: true,
  about: { "@type": "VideoGame", name: "Guild Wars 2" },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
