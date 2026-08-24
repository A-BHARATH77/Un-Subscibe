import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Unsub Hero | Forward to block unwanted emails instantly",
  description: "Permanently block unwanted senders from your inbox by forwarding emails to unsubscribe@unsubhero.com. No signup, no app installation, and no OAuth access required.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-mod-js" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="anonymous" />
        <link
          href="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/css/aeline.webflow.shared.113d25edf.min.css"
          rel="stylesheet"
          type="text/css"
          crossOrigin="anonymous"
        />

        <style dangerouslySetInnerHTML={{ __html: `
          .button[data-wf--button--variant="base"],
          .button-arrow,
          .button-arrow_wrap,
          .button-arrow .button-arrow_bg,
          .button-arrow_bg {
            background-color: #000000 !important;
            color: #ffffff !important;
            border-color: #000000 !important;
          }
          .button[data-wf--button--variant="base"]:hover,
          .button-arrow:hover,
          .button-arrow:hover .button-arrow_bg {
            background-color: #1a1a1a !important;
            border-color: #1a1a1a !important;
          }
          .button-arrow_text .text_button {
            color: #ffffff !important;
          }
          .button[data-wf--button--variant="base"] div {
            color: #ffffff !important;
          }
        `}} />
      </head>
      <body className="bg-primary" suppressHydrationWarning>
        {children}

        {/* Fonts — global, safe on every route */}
        <Script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js" strategy="beforeInteractive" />
        <Script id="webfont-init" strategy="beforeInteractive">{`WebFont.load({ google: { families: ["Inter:300,400,500,600,700", "Plus Jakarta Sans:300,400,500,600,700"] } });`}</Script>

        {/*
          GSAP, Swiper, and jQuery are safe to load globally — they have zero
          URL-aware routing logic and will NOT cause a 404 on /business or /personal.

          The Webflow runtime chunks (webflow.schunk.*) are intentionally excluded here
          and loaded only on the home page (src/app/page.tsx) because Webflow's router
          looks up CDN assets by the current URL slug, and /business doesn't exist in
          the original Webflow site — causing a 404 that breaks the page render.

          beforeInteractive is ONLY valid inside root layouts (Next.js restriction).
        */}

        {/* GSAP suite (from jsDelivr) */}
        <Script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Draggable.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/InertiaPlugin.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Observer.min.js" strategy="beforeInteractive" />

        {/* Swiper */}
        <Script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js" strategy="beforeInteractive" />

        {/* jQuery (Webflow dependency — safe globally, no routing logic) */}
        <Script src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=6929c116366a14507fc8424d" strategy="beforeInteractive" crossOrigin="anonymous" />

        {/* Webflow-bundled GSAP extras (includes SplitText, ScrollTrigger v3) */}
        <Script src="https://cdn.prod.website-files.com/gsap/3.15.0/gsap.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.prod.website-files.com/gsap/3.15.0/ScrollTrigger.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.prod.website-files.com/gsap/3.15.0/SplitText.min.js" strategy="beforeInteractive" />
        <Script id="gsap-register-init" strategy="beforeInteractive">{`gsap.registerPlugin(ScrollTrigger,SplitText);`}</Script>
      </body>
    </html>
  );
}
