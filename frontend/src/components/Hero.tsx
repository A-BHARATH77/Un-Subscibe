// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const [copied, setCopied] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 50);
    return () => clearTimeout(timer);
  }, []);

  const handlePersonalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => {
      router.push('/personal');
    }, 400);
  };

  return (
    <>
<section className="section_hero" data-anim="hero" suppressHydrationWarning style={{ height: '100%', position: 'relative', overflow: 'hidden', opacity: isEntering ? 0 : (isExiting ? 0 : 1), transform: isEntering ? 'scale(1.02)' : (isExiting ? 'scale(0.98)' : 'scale(1)'), transition: 'opacity 0.4s ease-out, transform 0.4s ease-out' }}>

{/* Video Background */}
<div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
  <video
    src="/background.mp4"
    autoPlay
    loop
    muted
    playsInline
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      minWidth: '100%',
      minHeight: '100%',
      width: 'auto',
      height: 'auto',
      transform: 'translate(-50%, -50%)',
      objectFit: 'cover'
    }}
  />
</div>
<div animation="wrap" className="hero_wrap" suppressHydrationWarning style={{ marginTop: '-100px', position: 'relative', zIndex: 10 }}>
<div className="padding-global is-hero" suppressHydrationWarning>
<div className="vertical-center" suppressHydrationWarning>
<h1 className="text-align-center" hero-text="" suppressHydrationWarning style={{ textShadow: '0 4px 16px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 0, 0, 0.6)' }}>
                  Forward and<br/><span className="opacity-73" suppressHydrationWarning>forget.</span>
</h1>
<div className="spacer-medium" style={{ height: '1.25rem' }} suppressHydrationWarning></div>
<div className="max-width-medium" suppressHydrationWarning>
<div className="text-base text-color-on-primary text-align-center" hero-text="" suppressHydrationWarning style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.95), 0 0 30px rgba(0, 0, 0, 0.6)' }}>
                    You forward an email, and that sender is permanently killed from your inbox. No signup's , nothing to manage, no apps to install, and absolutely no granting third-party OAuth access.
                  </div>
</div>
<div className="spacer-huge" style={{ height: '2.5rem' }} suppressHydrationWarning></div>
<div className="button_wrapper is-hero" style={{ justifyContent: 'center' }} suppressHydrationWarning>
  <button 
    onClick={() => {
      navigator.clipboard.writeText('Unsubscribe@unsubhero.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: '#1a1a1a',
      color: '#fff',
      padding: '10px 16px',
      borderRadius: '8px',
      border: '1px solid #333',
      cursor: 'pointer',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '0.9rem',
      fontWeight: '600',
      transition: 'all 0.2s',
      margin: '0 auto'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
  >
    <span>Unsubscribe@unsubhero.com</span>
    {copied ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    )}
  </button>
</div>

{/* Personal / Business Split Cards */}
<div style={{
  display: 'flex',
  gap: '16px',
  marginTop: '20px',
  justifyContent: 'center',
  flexWrap: 'wrap',
}} suppressHydrationWarning>

  {/* Personal Card */}
  <a href="/personal" onClick={handlePersonalClick} style={{ textDecoration: 'none' }} suppressHydrationWarning>
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '20px 28px',
        width: '220px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(15, 23, 42, 0.7)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(15, 23, 42, 0.45)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
      suppressHydrationWarning
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} suppressHydrationWarning>
        <span style={{ color: '#fff', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '700', fontSize: '1rem', letterSpacing: '-0.01em' }} suppressHydrationWarning>Personal</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.75)', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '0.78rem', lineHeight: '1.4', fontWeight: '400' }} suppressHydrationWarning>Declutter your inbox, no login required</span>
    </div>
  </a>

  {/* Business Card */}
  <a href="/business" style={{ textDecoration: 'none' }} suppressHydrationWarning>
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '20px 28px',
        width: '220px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(15, 23, 42, 0.7)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(15, 23, 42, 0.45)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
      suppressHydrationWarning
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} suppressHydrationWarning>
        <span style={{ color: '#fff', fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '700', fontSize: '1rem', letterSpacing: '-0.01em' }} suppressHydrationWarning>Business</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.75)', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '0.78rem', lineHeight: '1.4', fontWeight: '400' }} suppressHydrationWarning>Spare your colleague's inbox</span>
    </div>
  </a>

</div>
</div>
</div>
</div>
<div className="spacer" suppressHydrationWarning>
<div className="spacer-desktop" style={{ 'height': '4rem' }} suppressHydrationWarning></div>
<div className="spacer-tablet" style={{ 'height': '5rem' }} suppressHydrationWarning></div>
<div className="spacer-mobile" style={{ 'height': '5rem' }} suppressHydrationWarning></div>
</div>
<div animation="visual" className="_3d" suppressHydrationWarning>
<div className="wrap" suppressHydrationWarning>
<div className="group first" suppressHydrationWarning>
<div className="img3d" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007e9793bec9aef0bae6_card.avif" suppressHydrationWarning />
</div>
<div className="img3d is-first" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007db9ab99a268357410_card-3.avif" suppressHydrationWarning />
</div>
<div className="img3d is-second" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007d21f950db130e28c9_card-6.avif" suppressHydrationWarning />
</div>
<div className="img3d is-third" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007e9793bec9aef0bae6_card.avif" suppressHydrationWarning />
</div>
<div className="img3d is-fourth" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007db9ab99a268357410_card-3.avif" suppressHydrationWarning />
</div>
<div className="img3d is-fifth" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007d21f950db130e28c9_card-6.avif" suppressHydrationWarning />
</div>
<div className="img3d is-fifth" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007e9793bec9aef0bae6_card.avif" suppressHydrationWarning />
</div>
<div className="img3d is-six" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007db9ab99a268357410_card-3.avif" suppressHydrationWarning />
</div>
<div className="img3d is-seven" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007d21f950db130e28c9_card-6.avif" suppressHydrationWarning />
</div>
</div>
<div className="group second" suppressHydrationWarning>
<div className="img3d" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007eb87553c5aa32934f_card-1.avif" suppressHydrationWarning />
</div>
<div className="img3d is-first" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007e27ef20e6e3edd02e_card-4.avif" suppressHydrationWarning />
</div>
<div className="img3d is-second" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007e9468539ba66cdd61_card-7.avif" suppressHydrationWarning />
</div>
<div className="img3d is-third" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007eb87553c5aa32934f_card-1.avif" suppressHydrationWarning />
</div>
<div className="img3d is-fourth" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007e27ef20e6e3edd02e_card-4.avif" suppressHydrationWarning />
</div>
<div className="img3d is-fifth" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007e9468539ba66cdd61_card-7.avif" suppressHydrationWarning />
</div>
<div className="img3d is-fifth" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007eb87553c5aa32934f_card-1.avif" suppressHydrationWarning />
</div>
<div className="img3d is-six" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007e27ef20e6e3edd02e_card-4.avif" suppressHydrationWarning />
</div>
<div className="img3d is-seven" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007e9468539ba66cdd61_card-7.avif" suppressHydrationWarning />
</div>
</div>
<div className="group third" suppressHydrationWarning>
<div className="img3d" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007dd38878bbefc784aa_card-8.avif" suppressHydrationWarning />
</div>
<div className="img3d is-first" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007d920bdd6882dc8eb7_card-2.avif" suppressHydrationWarning />
</div>
<div className="img3d is-second" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007d1354bb8698409c38_card-5.avif" suppressHydrationWarning />
</div>
<div className="img3d is-third" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007dd38878bbefc784aa_card-8.avif" suppressHydrationWarning />
</div>
<div className="img3d is-fourth" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007d920bdd6882dc8eb7_card-2.avif" suppressHydrationWarning />
</div>
<div className="img3d is-fifth" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007d1354bb8698409c38_card-5.avif" suppressHydrationWarning />
</div>
<div className="img3d is-fifth" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007dd38878bbefc784aa_card-8.avif" suppressHydrationWarning />
</div>
<div className="img3d is-six" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007d920bdd6882dc8eb7_card-2.avif" suppressHydrationWarning />
</div>
<div className="img3d is-seven" suppressHydrationWarning>
<img alt="" className="image3d" loading="lazy" src="https://cdn.prod.website-files.com/6929c116366a14507fc8424d/69a5007d1354bb8698409c38_card-5.avif" suppressHydrationWarning />
</div>
</div>
</div>
</div>
<div className="_3d_spacer" suppressHydrationWarning></div>

</section>
    </>
  );
}
