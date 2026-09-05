import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./lib/theme-context";
import { LanguageProvider } from "./lib/language-context";
import { LandingProvider } from "./lib/landing-context";

const BASE_URL = "https://adiprimanto.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Adi Primanto — Jasa Website & Aplikasi Profesional Yogyakarta",
    template: "%s | Adi Primanto",
  },
  description:
    "Jasa pembuatan website dan aplikasi mobile profesional di Yogyakarta. Spesialis Next.js, Vue.js, React Native, Laravel. 5+ tahun pengalaman, 20+ proyek selesai. Konsultasi gratis.",
  keywords: [
    "jasa website Yogyakarta",
    "jasa pembuatan website",
    "jasa aplikasi mobile",
    "web developer Yogyakarta",
    "software engineer freelance",
    "jasa landing page",
    "jasa company profile",
    "Next.js developer Indonesia",
    "React developer Yogyakarta",
    "Vue.js developer",
    "Flutter developer Indonesia",
    "React Native developer",
    "jasa website bisnis",
    "freelance web developer Indonesia",
    "Adi Primanto",
  ],
  authors: [{ name: "Adi Primanto", url: BASE_URL }],
  creator: "Adi Primanto",
  publisher: "Adi Primanto",
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Adi Primanto — Jasa Website & Aplikasi Profesional Yogyakarta",
    description:
      "Jasa pembuatan website dan aplikasi mobile profesional. Spesialis Next.js, Vue.js, React Native, Laravel. 5+ tahun pengalaman, konsultasi gratis.",
    type: "website",
    url: BASE_URL,
    siteName: "Adi Primanto",
    images: [
      {
        url: "/adi.webp",
        width: 1200,
        height: 630,
        alt: "Adi Primanto — Jasa Website & Aplikasi Profesional Yogyakarta",
      },
    ],
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adi Primanto — Jasa Website & Aplikasi Profesional Yogyakarta",
    description:
      "Jasa pembuatan website dan aplikasi mobile profesional di Yogyakarta. Konsultasi gratis.",
    images: ["/adi.webp"],
    creator: "@adiprimanto",
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

// JSON-LD is hardcoded static data — no XSS risk
const jsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${BASE_URL}/#person`,
      name: "Adi Primanto",
      url: BASE_URL,
      image: `${BASE_URL}/adi.webp`,
      jobTitle: "Software Engineer & Web Developer",
      description:
        "Software Engineer dengan 5+ tahun pengalaman membangun website dan aplikasi mobile profesional untuk bisnis di Indonesia.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Yogyakarta",
        addressCountry: "ID",
      },
      sameAs: [
        "https://github.com/adiprimanto",
        "https://www.linkedin.com/in/adi-primanto/",
        "https://www.instagram.com/adiprimanto",
      ],
      knowsAbout: [
        "Web Development",
        "Mobile App Development",
        "React",
        "Next.js",
        "Vue.js",
        "Flutter",
        "React Native",
        "TypeScript",
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": `${BASE_URL}/#business`,
      name: "Adi Primanto — Jasa Website & Aplikasi",
      url: BASE_URL,
      image: `${BASE_URL}/adi.webp`,
      description:
        "Jasa pembuatan website profesional dan aplikasi mobile untuk bisnis dan UMKM di Indonesia.",
      telephone: "+6285727346620",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Yogyakarta",
        addressRegion: "DI Yogyakarta",
        addressCountry: "ID",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: -7.7956,
        longitude: 110.3695,
      },
      areaServed: { "@type": "Country", name: "Indonesia" },
      priceRange: "$$",
      openingHours: "Mo-Fr 09:00-17:00",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Layanan Web & App Development",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Jasa Pembuatan Landing Page",
              description:
                "Landing page profesional dengan konversi tinggi menggunakan Next.js atau Vue.js",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Jasa Pembuatan Company Profile",
              description:
                "Website company profile profesional untuk meningkatkan kredibilitas bisnis",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Jasa Pembuatan Aplikasi Mobile",
              description:
                "Aplikasi mobile cross-platform menggunakan React Native atau Flutter",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Jasa Web Application Development",
              description:
                "Aplikasi web kompleks dengan dashboard, CRM, dan sistem manajemen",
            },
          },
        ],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "Adi Primanto",
      description: "Portfolio & Jasa Web Development",
      publisher: { "@id": `${BASE_URL}/#person` },
      inLanguage: "id-ID",
    },
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="/favicon-32.png"
          type="image/png"
          sizes="32x32"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne+Mono&family=Inter:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        {/* JSON-LD structured data — static hardcoded content, no XSS risk */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
        {/* Applies saved theme before paint to avoid a light/dark flash — no user input involved */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}",
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <LandingProvider>
              <a href="#main-content" className="skip-to-content">
                Lewati ke konten utama
              </a>
              {children}
            </LandingProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
