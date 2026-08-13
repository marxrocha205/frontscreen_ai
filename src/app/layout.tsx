import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/context/i18n-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { CookieBanner } from "@/components/cookie-banner";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://appscreenai.com'),
  title: "ScreenAI",
  description: "Seu assistente de IA para análise de tela em tempo real",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.png' }
    ]
  },
  openGraph: {
    title: "ScreenAI",
    description: "Seu assistente de IA para análise de tela em tempo real",
    siteName: "ScreenAI",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.className} dark h-[100dvh] overflow-hidden overscroll-none antialiased bg-black`}
      suppressHydrationWarning
    >
      <body className="h-[100dvh] flex flex-col overflow-hidden overscroll-none bg-black" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties} suppressHydrationWarning>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18247965256"
          strategy="afterInteractive"
        />
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18247965256');
          `}
        </Script>
        <Script id="utmify-pixel-init" strategy="afterInteractive">
          {`
            window.pixelId = "69cff704edd1516d3ada4900";
            var a = document.createElement("script");
            a.setAttribute("async", "");
            a.setAttribute("defer", "");
            a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
            document.head.appendChild(a);
          `}
        </Script>
        <Script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          strategy="afterInteractive"
          data-utmify-prevent-xcod-sck
          data-utmify-prevent-subids
        />
        <Script id="schema-org" type="application/ld+json" strategy="afterInteractive">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "ScreenAI",
              "url": "https://appscreenai.com",
              "image": "https://appscreenai.com/icon.png",
              "publisher": {
                "@type": "Organization",
                "name": "ScreenAI",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://appscreenai.com/icon.png"
                }
              }
            }
          `}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
        >
          <I18nProvider>
            <TooltipProvider>
              <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                {children}
                <CookieBanner />
                <script dangerouslySetInnerHTML={{
                  __html: `
                    (function(c,l,a,r,i,t,y){
                        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                    })(window, document, "clarity", "script", "xieg2rw09t");
                  `
                }} />
              </GoogleOAuthProvider>
            </TooltipProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
