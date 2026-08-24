import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TemplateOverlay from '@/components/TemplateOverlay';
import Script from 'next/script';

export default function Home() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        body, html { overflow: hidden !important; margin: 0 !important; padding: 0 !important; background: white !important; height: 100% !important; }
      `}} />
      <div
        className="page-wrapper"
        style={{ position: 'absolute', top: '6px', bottom: '6px', left: '6px', right: '6px', overflow: 'hidden', borderRadius: '20px', margin: 0 }}
      >
        <Navbar />
        <main className="main-wrapper">
          <Hero />
        </main>
        <TemplateOverlay />
      </div>

      {/*
        Webflow runtime chunks — home page ONLY, loaded lazily.

        • lazyOnload is valid inside page components (no "script in React component" warning).
        • These scripts MUST stay here and NOT in layout.tsx because Webflow's router
          resolves page-specific CDN bundles by URL slug at runtime. Slugs like /business
          and /personal never existed in the original Webflow project, so the CDN returns
          a 404 — which Webflow's error handler re-throws and crashes the page render.
        • GSAP, Swiper, and jQuery (which have no URL routing logic) live in layout.tsx
          as beforeInteractive so they are available before hydration everywhere.
      */}
      <Script
        src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/js/webflow.schunk.36b8fb49256177c8.js"
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />
      <Script
        src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/js/webflow.schunk.7fa942c6f9da5827.js"
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />
      <Script
        src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/js/webflow.schunk.4ed80055bdae3496.js"
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />
      <Script
        src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/js/webflow.ec325c54.28244e4c1d8bb63f.js"
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />
    </>
  );
}
