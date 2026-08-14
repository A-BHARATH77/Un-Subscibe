// @ts-nocheck
'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Lenis from 'lenis';

const problems = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
      </svg>
    ),
    title: 'It just moves them to spam',
    body: "When you tap \"Unsubscribe\" in iPhone Mail, the email gets flagged as spam — but the sender still has your address. You're still on their mailing list. They can email you again tomorrow.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
    title: 'Apple-only — Android gets nothing',
    body: "The built-in unsubscribe button only exists on iOS Mail. If you switch phones, use Gmail on the web, or work on Windows — it's completely gone. Your inbox, your problem.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'One email at a time, forever',
    body: "You have to manually tap unsubscribe on every single newsletter. Next week, a new one arrives. You do it again. There's no memory, no automation — just you, doing it manually, indefinitely.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="12" rx="10" ry="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    title: 'Your email is still in their database',
    body: "Unsubscribing from the Apple prompt doesn't delete you from the sender's list. Your address gets sold, leaked in data breaches, or reactivated the moment they launch a new campaign.",
  },
];

const benefits = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l.95-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16"/>
      </svg>
    ),
    label: 'No login required',
    sub: 'Not even an account. Just forward and walk away.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    label: 'Works on every device',
    sub: 'iPhone, Android, Windows, Mac — any email client.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    label: 'Permanent removal',
    sub: 'We automate the actual unsubscribe flow on their website.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    label: 'No OAuth permissions',
    sub: 'We never ask for access to your inbox.',
  },
];

export default function PersonalPage() {
  const [copied, setCopied] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 50);

    const wrapper = document.querySelector('.page-wrapper');
    const lenis = new Lenis({
      wrapper: wrapper || undefined,
      content: wrapper?.firstElementChild || undefined,
      autoRaf: true,
      duration: 1.2,
    });
    
    const ro = new ResizeObserver(() => {
      lenis.resize();
    });
    if (wrapper) {
      ro.observe(wrapper);
    } else {
      ro.observe(document.body);
    }

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      lenis.destroy();
    };
  }, []);

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => {
      router.push('/');
    }, 400);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('Unsubscribe@unsubhero.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .personal-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100%;
          background: 
            radial-gradient(circle at 10% 90%, #438fcb 0%, transparent 40%),
            radial-gradient(circle at 90% 10%, #7eb3df 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, #e0f2fe 0%, #a2cff0 50%, #76b1e0 100%);
          background-color: #8abce4;
          position: relative;
          overflow: hidden;
          color: #1a1a1a;
          -webkit-font-smoothing: antialiased;
          padding-bottom: 80px;
        }

        /* ── Moving Clouds ── */
        .db-clouds {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        .css-cloud {
          position: absolute;
          background: #fff;
          border-radius: 200px;
          opacity: 0.7;
          filter: blur(14px);
        }
        .css-cloud::before, .css-cloud::after {
          content: '';
          position: absolute;
          background: #fff;
          border-radius: 50%;
        }
        .css-cloud::before {
          width: 50%; height: 150%;
          top: -70%; left: 15%;
        }
        .css-cloud::after {
          width: 40%; height: 120%;
          top: -50%; right: 15%;
        }
        .cloud-1 { width: 400px; height: 120px; top: 15%; left: -400px; opacity: 0.8; animation: floatCloud 50s linear infinite; }
        .cloud-2 { width: 550px; height: 160px; top: 45%; left: -600px; opacity: 0.6; animation: floatCloud 75s linear infinite 15s; }
        .cloud-3 { width: 350px; height: 100px; top: 75%; left: -400px; opacity: 0.7; animation: floatCloud 40s linear infinite 5s; }
        .cloud-4 { width: 600px; height: 180px; top: 5%; left: -600px; opacity: 0.45; animation: floatCloud 90s linear infinite 30s; }
        .cloud-5 { width: 450px; height: 140px; top: 60%; left: -500px; opacity: 0.65; animation: floatCloud 65s linear infinite 25s; }

        @keyframes floatCloud {
          0% { transform: translateX(0) scale(1); }
          50% { transform: translateX(50vw) scale(1.05); }
          100% { transform: translateX(calc(100vw + 1000px)) scale(1); }
        }

        /* ── Nav ── */
        .pn-nav {
          position: sticky; top: 0; z-index: 100;
          padding: 16px 40px;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.25);
        }
        .pn-logo {
          font-size: 1rem; font-weight: 800; letter-spacing: -0.03em;
          color: #1a1a1a; text-decoration: none;
        }
        .pn-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.85rem; font-weight: 600; color: #2e5574;
          text-decoration: none; transition: color 0.2s;
        }
        .pn-back:hover { color: #1a1a1a; }

        /* ── Hero ── */
        .pn-hero {
          max-width: 700px; margin: 0 auto;
          padding: 80px 32px 56px;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .pn-eyebrow {
          display: inline-block;
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.8);
          color: #296b9e;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 14px; border-radius: 99px;
          margin-bottom: 28px;
        }
        .pn-h1 {
          font-size: clamp(1.9rem, 4.5vw, 3rem);
          font-weight: 800; letter-spacing: -0.04em; line-height: 1.1;
          color: #ffffff; margin-bottom: 18px;
        }
        .pn-h1 em { font-style: normal; color: inherit; opacity: 0.73; }
        .pn-sub {
          font-size: 1rem; color: #2e5574;
          line-height: 1.7; max-width: 460px; margin: 0 auto;
        }

        /* ── Section wrapper ── */
        .pn-section { max-width: 960px; margin: 0 auto; padding: 0 32px 72px; position: relative; z-index: 1; }
        .pn-section-label {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #2e5574;
          margin-bottom: 24px;
        }

        /* ── Problem cards (Bento Grid) ── */
        .pn-problems {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .pn-problem-card {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px; padding: 24px;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }
        .pn-problem-card:hover {
          background: rgba(255, 255, 255, 0.6);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-3px);
        }
        @media (min-width: 768px) {
          .pn-problems {
            grid-template-columns: repeat(3, 1fr);
          }
          .pn-problem-card:nth-child(1) {
            grid-column: span 2;
          }
          .pn-problem-card:nth-child(2) {
            grid-column: span 1;
          }
          .pn-problem-card:nth-child(3) {
            grid-column: span 1;
          }
          .pn-problem-card:nth-child(4) {
            grid-column: span 2;
          }
        }
        .pn-problem-icon {
          width: 40px; height: 40px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #dc2626; margin-bottom: 16px;
        }
        .pn-problem-title {
          font-size: 0.92rem; font-weight: 700; color: #1a1a1a;
          margin-bottom: 8px; letter-spacing: -0.01em;
        }
        .pn-problem-body {
          font-size: 0.83rem; color: #2e5574; line-height: 1.65;
        }

        /* ── Divider ── */
        .pn-divider {
          border: none; border-top: 1px solid rgba(255,255,255,0.25);
          max-width: 960px; margin: 0 auto 72px;
        }

        /* ── Solution ── */
        .pn-solution { max-width: 960px; margin: 0 auto; padding: 0 32px 72px; position: relative; z-index: 1; }
        .pn-solution-h2 {
          font-size: clamp(1.5rem, 3.5vw, 2.2rem);
          font-weight: 800; letter-spacing: -0.04em; color: #ffffff;
          margin-bottom: 10px; line-height: 1.15;
        }
        .pn-solution-sub {
          font-size: 0.92rem; color: #2e5574; line-height: 1.65;
          max-width: 440px; margin-bottom: 36px;
        }
        .pn-benefits {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px; margin-bottom: 48px;
        }
        .pn-benefit {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px; padding: 18px 20px;
          display: flex; flex-direction: column; gap: 6px;
          transition: all 0.25s ease;
        }
        .pn-benefit:hover {
          background: rgba(255, 255, 255, 0.6);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }
        .pn-benefit-top {
          display: flex; align-items: center; gap: 10px;
          color: #296b9e;
        }
        .pn-benefit-label {
          font-size: 0.88rem; font-weight: 700; color: #1a1a1a;
        }
        .pn-benefit-sub {
          font-size: 0.78rem; color: #2e5574; line-height: 1.5;
        }

        /* ── CTA ── */
        .pn-cta {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 44px 40px; text-align: center;
        }
        .pn-cta-h3 {
          font-size: 1.35rem; font-weight: 800; letter-spacing: -0.03em;
          color: #fff; margin-bottom: 8px;
        }
        .pn-cta-sub {
          font-size: 0.88rem; color: rgba(255,255,255,0.5);
          margin-bottom: 28px; line-height: 1.65;
        }
        .pn-copy-btn {
          display: inline-flex; align-items: center; gap: 10px;
          background: #fff; color: #0f172a;
          padding: 13px 22px; border-radius: 10px;
          border: none; cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.92rem; font-weight: 700;
          transition: background 0.2s; letter-spacing: -0.01em;
        }
        .pn-copy-btn:hover { background: #e2e8f0; }

        @media (max-width: 768px) {
          .page-wrapper {
            top: 6px !important;
            bottom: 6px !important;
            left: 6px !important;
            right: 6px !important;
            border-radius: 16px !important;
          }
          .navbar_content {
            padding: 0 10px !important;
          }
          .navbar_logo {
            font-size: 1.25rem !important;
          }
          .pn-hero {
            padding: 100px 16px 28px !important; /* Pushes the hero badge and text below the navbar logo and button */
          }
          .pn-section, .pn-solution {
            padding-left: 16px !important;
            padding-right: 16px !important;
            padding-bottom: 40px !important;
          }
          .pn-divider {
            margin-bottom: 40px !important;
          }
          .pn-cta {
            padding: 28px 16px !important;
          }
        }

        @media (max-width: 480px) {
          .navbar_logo {
            font-size: 1.15rem !important; /* Avoids horizontal crowding on narrow phone screens */
          }
          .pn-copy-btn {
            width: 100% !important;
            justify-content: center !important;
            font-size: 0.8rem !important;
            padding: 12px 8px !important;
          }
          .pn-benefits {
            grid-template-columns: 1fr !important;
          }
          .pn-cta-h3 {
            font-size: 1.15rem !important;
          }
          .pn-cta-sub {
            font-size: 0.8rem !important;
          }
        }`}</style>
      <style dangerouslySetInnerHTML={{__html: `
        body, html { overflow: hidden !important; margin: 0 !important; padding: 0 !important; background: white !important; height: 100% !important; }
      `}} />

      <div className="page-wrapper" style={{ position: 'absolute', top: '12px', bottom: '12px', left: '12px', right: '12px', overflowY: 'auto', borderRadius: '24px', margin: 0 }}>
        <div className="personal-root" style={{
          opacity: isEntering ? 0 : (isExiting ? 0 : 1),
          transform: isEntering ? 'scale(1.02)' : (isExiting ? 'scale(0.98)' : 'scale(1)'),
          transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          minHeight: '100%'
        }}>
          {/* Moving Clouds */}
          <div className="db-clouds">
            <div className="css-cloud cloud-1"></div>
            <div className="css-cloud cloud-2"></div>
            <div className="css-cloud cloud-3"></div>
            <div className="css-cloud cloud-4"></div>
            <div className="css-cloud cloud-5"></div>
          </div>

          {/* Nav Header */}
          <div className="navbar w-nav" role="banner" suppressHydrationWarning>
            <div className="padding-global is-navbar" suppressHydrationWarning>
              <div className="container-large" suppressHydrationWarning>
                <div className="navbar_content" suppressHydrationWarning>
                  <Link href="/" onClick={handleBackClick} className="navbar_logo-link w-inline-block" suppressHydrationWarning>
                    <div className="navbar_logo" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '-0.02em' }} suppressHydrationWarning>UNSUB HERO</div>
                  </Link>
                  <div className="nav_buttons-wrap" suppressHydrationWarning>
                    <div animation="hero" className="login-wrap" suppressHydrationWarning>
                      <Link 
                        href="/" 
                        onClick={handleBackClick}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#1a1a1a',
                          color: '#fff',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          border: '1px solid #333',
                          fontFamily: '"Plus Jakarta Sans", sans-serif',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                          minWidth: '100px',
                          textAlign: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#1a1a1a'}
                        suppressHydrationWarning
                      >
                        Back
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="pn-hero">
            <div className="pn-eyebrow">For Personal Use</div>
            <h1 className="pn-h1" style={{ textShadow: '0 4px 16px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 0, 0, 0.6)' }}>
              Your iPhone&apos;s unsubscribe button<br/>
              <em>isn&apos;t actually working.</em>
            </h1>
            <p className="pn-sub">
              Here&apos;s what&apos;s really happening — and what actually fixes it.
            </p>
          </div>

          {/* Problem Cards */}
          <div className="pn-section">
            <p className="pn-section-label">Why the default solution fails</p>
            <div className="pn-problems">
              {problems.map((p) => (
                <div key={p.title} className="pn-problem-card">
                  <div className="pn-problem-icon">{p.icon}</div>
                  <div className="pn-problem-title">{p.title}</div>
                  <div className="pn-problem-body">{p.body}</div>
                </div>
              ))}
            </div>
          </div>

          <hr className="pn-divider" />

          {/* Solution */}
          <div className="pn-solution">
            <p className="pn-section-label">The fix</p>
            <h2 className="pn-solution-h2" style={{ textShadow: '0 4px 16px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 0, 0, 0.6)' }}>UnSub Hero actually works.</h2>
            <p className="pn-solution-sub">
              No login. No app. No granting access to your inbox. Just forward the email — we handle the rest, permanently.
            </p>

            <div className="pn-benefits">
              {benefits.map((b) => (
                <div key={b.label} className="pn-benefit">
                  <div className="pn-benefit-top">
                    {b.icon}
                    <span className="pn-benefit-label">{b.label}</span>
                  </div>
                  <span className="pn-benefit-sub">{b.sub}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="pn-cta">
              <h3 className="pn-cta-h3">Ready to clean up your inbox?</h3>
              <p className="pn-cta-sub">
                Copy the address below and forward any unwanted email to it.<br/>
                That&apos;s the entire setup.
              </p>
              <button className="pn-copy-btn" onClick={handleCopy}>
                <span>Unsubscribe@unsubhero.com</span>
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
