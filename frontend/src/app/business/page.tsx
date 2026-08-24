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
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Every teammate has the same problem',
    body: "Sarah's inbox is swamped. So is James's. And Priya's. Each person is individually fighting the same spam battle, wasting minutes every day — multiplied across your whole team.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    title: "IT tools don't solve it at the source",
    body: "Spam filters and firewall rules help, but they don't actually unsubscribe anyone. The mailing lists still have your team's addresses — and can re-engage them anytime.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Hours lost to inbox management, per month',
    body: "If your team spends even 5 minutes a day on unwanted emails, that's over 20 hours a month per person — before they've done a single minute of real work.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Work addresses end up in breach databases',
    body: "Every subscription your team signed up for is a liability. When those services get breached, your company's email addresses surface in credential dumps — creating real security exposure.",
  },
];

const benefits = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: 'One address for the whole team',
    sub: 'Everyone forwards to the same place. No per-seat accounts, no admin panel.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
      </svg>
    ),
    label: 'No IT setup required',
    sub: 'No domain verification, no mail server changes. Works with any email client.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    label: 'Permanent removal',
    sub: "We automate the actual opt-out on each sender's website — for good.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    label: 'Zero OAuth permissions',
    sub: 'We never ask for inbox access. No risk, no compliance headache.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Copy the address',
    body: "Send your team one message with the UnSub Hero address. That's the entire rollout.",
  },
  {
    number: '02',
    title: 'Everyone just forwards',
    body: "When someone gets unwanted mail, they forward it — exactly like they'd forward anything else.",
  },
  {
    number: '03',
    title: 'We handle the rest',
    body: 'We locate the real unsubscribe link, complete the opt-out, and confirm. No one has to think about it again.',
  },
];

export default function BusinessPage() {
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
        .biz-root {
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

        /* ── Hero ── */
        .biz-hero {
          max-width: 700px; margin: 0 auto;
          padding: 80px 32px 56px;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .biz-eyebrow {
          display: inline-block;
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.8);
          color: #296b9e;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 14px; border-radius: 99px;
          margin-bottom: 28px;
        }
        .biz-h1 {
          font-size: clamp(1.9rem, 4.5vw, 3rem);
          font-weight: 800; letter-spacing: -0.04em; line-height: 1.1;
          color: #ffffff; margin-bottom: 18px;
        }
        .biz-h1 em { font-style: normal; color: inherit; opacity: 0.73; }
        .biz-sub {
          font-size: 1rem; color: #2e5574;
          line-height: 1.7; max-width: 480px; margin: 0 auto;
        }

        /* ── Section wrapper ── */
        .biz-section { max-width: 960px; margin: 0 auto; padding: 0 32px 72px; position: relative; z-index: 1; }
        .biz-section-label {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #2e5574;
          margin-bottom: 24px;
        }

        /* ── Problem cards (Bento Grid) ── */
        .biz-problems {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .biz-problem-card {
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
        .biz-problem-card:hover {
          background: rgba(255, 255, 255, 0.6);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-3px);
        }
        @media (min-width: 768px) {
          .biz-problems {
            grid-template-columns: repeat(3, 1fr);
          }
          .biz-problem-card:nth-child(1) { grid-column: span 2; }
          .biz-problem-card:nth-child(2) { grid-column: span 1; }
          .biz-problem-card:nth-child(3) { grid-column: span 1; }
          .biz-problem-card:nth-child(4) { grid-column: span 2; }
        }
        .biz-problem-icon {
          width: 40px; height: 40px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #dc2626; margin-bottom: 16px;
        }
        .biz-problem-title {
          font-size: 0.92rem; font-weight: 700; color: #1a1a1a;
          margin-bottom: 8px; letter-spacing: -0.01em;
        }
        .biz-problem-body {
          font-size: 0.83rem; color: #2e5574; line-height: 1.65;
        }

        /* ── Divider ── */
        .biz-divider {
          border: none; border-top: 1px solid rgba(255,255,255,0.25);
          max-width: 960px; margin: 0 auto 72px;
        }

        /* ── How it works steps ── */
        .biz-solution { max-width: 960px; margin: 0 auto; padding: 0 32px 72px; position: relative; z-index: 1; }
        .biz-solution-h2 {
          font-size: clamp(1.5rem, 3.5vw, 2.2rem);
          font-weight: 800; letter-spacing: -0.04em; color: #ffffff;
          margin-bottom: 10px; line-height: 1.15;
        }
        .biz-solution-sub {
          font-size: 0.92rem; color: #2e5574; line-height: 1.65;
          max-width: 440px; margin-bottom: 36px;
        }
        .biz-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 48px;
        }
        .biz-step {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px; padding: 28px 24px;
          transition: all 0.25s ease;
        }
        .biz-step:hover {
          background: rgba(255, 255, 255, 0.6);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }
        .biz-step-number {
          font-size: 2.4rem; font-weight: 800; letter-spacing: -0.05em;
          color: rgba(41, 107, 158, 0.2); line-height: 1;
          margin-bottom: 16px;
        }
        .biz-step-title {
          font-size: 0.92rem; font-weight: 700; color: #1a1a1a;
          margin-bottom: 8px; letter-spacing: -0.01em;
        }
        .biz-step-body {
          font-size: 0.83rem; color: #2e5574; line-height: 1.65;
        }

        /* ── Outlook mockup ── */
        .biz-outlook-wrap {
          margin-bottom: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .biz-outlook-label {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #2e5574;
        }
        .biz-outlook-frame {
          width: 100%; max-width: 560px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow:
            0 2px 0 rgba(255,255,255,0.6) inset,
            0 24px 60px rgba(0,0,0,0.18),
            0 4px 16px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.55);
          font-family: 'Segoe UI', 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          background: #f3f3f3;
        }
        /* Outlook title bar */
        .ol-titlebar {
          background: #0078d4;
          padding: 8px 12px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .ol-titlebar-left { display: flex; align-items: center; gap: 8px; }
        .ol-app-icon {
          width: 18px; height: 18px; flex-shrink: 0;
          background: #fff; border-radius: 3px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.6rem; font-weight: 900; color: #0078d4;
          letter-spacing: -0.05em;
        }
        .ol-title-text {
          font-size: 0.72rem; color: rgba(255,255,255,0.85); font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 340px;
        }
        .ol-titlebar-actions { display: flex; gap: 0; }
        .ol-tb-action {
          color: rgba(255,255,255,0.7); font-size: 0.72rem;
          padding: 2px 10px; cursor: pointer; line-height: 1.5;
          transition: background 0.15s;
        }
        .ol-tb-action:hover { background: rgba(255,255,255,0.15); }
        .ol-tb-close:hover { background: #c42b1c; color: #fff; }
        /* Ribbon */
        .ol-ribbon {
          background: #f3f3f3;
          border-bottom: 1px solid #d6d6d6;
          padding: 6px 14px;
          display: flex; align-items: center; gap: 6px;
        }
        .ol-ribbon-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 3px;
          padding: 4px 10px;
          color: #444; font-size: 0.72rem; font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ol-ribbon-btn:hover { background: #e5e5e5; border-color: #c8c8c8; }
        .ol-ribbon-btn-primary {
          background: #0078d4;
          border-color: #0078d4;
          color: #fff;
        }
        .ol-ribbon-btn-primary:hover { background: #006cbf; border-color: #006cbf; }
        .ol-ribbon-sep { width: 1px; height: 20px; background: #d6d6d6; margin: 0 4px; }
        /* Compose area */
        .ol-compose { background: #fff; }
        .ol-field {
          display: flex;
          align-items: center;
          padding: 8px 14px;
          border-bottom: 1px solid #ebebeb;
          gap: 10px;
          min-height: 36px;
        }
        .ol-field-label {
          color: #888; font-size: 0.72rem; font-weight: 600;
          width: 36px; flex-shrink: 0; text-align: right;
          letter-spacing: 0.01em;
        }
        .ol-field-value {
          color: #1a1a1a; font-size: 0.82rem; flex: 1;
        }
        .ol-address-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: #ddeeff;
          border: 1px solid #b3d4f5;
          border-radius: 3px;
          padding: 2px 8px 2px 5px;
          color: #005a9e; font-size: 0.78rem; font-weight: 600;
        }
        .ol-address-chip-avatar {
          width: 18px; height: 18px; border-radius: 50%;
          background: linear-gradient(135deg, #0078d4, #4facfe);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.58rem; font-weight: 800; color: #fff; flex-shrink: 0;
        }
        .ol-subject-value { color: #1a1a1a; font-size: 0.82rem; font-weight: 600; }
        .ol-body-area {
          padding: 14px 16px;
          min-height: 110px;
          background: #fff;
        }
        .ol-fwd-label {
          font-size: 0.7rem; color: #aaa; margin-bottom: 8px;
          display: flex; align-items: center; gap: 6px;
        }
        .ol-fwd-line { flex: 1; height: 1px; background: #e8e8e8; }
        .ol-fwd-meta { color: #999; font-size: 0.72rem; line-height: 1.8; margin-bottom: 10px; }
        .ol-fwd-meta strong { color: #555; }
        .ol-fwd-body-text { color: #bbb; font-size: 0.78rem; line-height: 1.7; font-style: italic; }
        /* Status bar */
        .ol-statusbar {
          background: #f3f3f3;
          border-top: 1px solid #d6d6d6;
          padding: 5px 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .ol-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #0078d4;
        }
        .ol-status-text { color: #888; font-size: 0.68rem; }

        /* ── Benefits grid ── */
        .biz-benefits {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px; margin-bottom: 48px;
        }
        .biz-benefit {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px; padding: 18px 20px;
          display: flex; flex-direction: column; gap: 6px;
          transition: all 0.25s ease;
        }
        .biz-benefit:hover {
          background: rgba(255, 255, 255, 0.6);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }
        .biz-benefit-top {
          display: flex; align-items: center; gap: 10px;
          color: #296b9e;
        }
        .biz-benefit-label {
          font-size: 0.88rem; font-weight: 700; color: #1a1a1a;
        }
        .biz-benefit-sub {
          font-size: 0.78rem; color: #2e5574; line-height: 1.5;
        }

        /* ── CTA ── */
        .biz-cta {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 44px 40px; text-align: center;
        }
        .biz-cta-h3 {
          font-size: 1.35rem; font-weight: 800; letter-spacing: -0.03em;
          color: #fff; margin-bottom: 8px;
        }
        .biz-cta-sub {
          font-size: 0.88rem; color: rgba(255,255,255,0.5);
          margin-bottom: 28px; line-height: 1.65;
        }
        .biz-copy-btn {
          display: inline-flex; align-items: center; gap: 10px;
          background: #fff; color: #0f172a;
          padding: 13px 22px; border-radius: 10px;
          border: none; cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.92rem; font-weight: 700;
          transition: background 0.2s; letter-spacing: -0.01em;
        }
        .biz-copy-btn:hover { background: #e2e8f0; }

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
          .biz-hero {
            padding: 100px 16px 28px !important;
          }
          .biz-section, .biz-solution {
            padding-left: 16px !important;
            padding-right: 16px !important;
            padding-bottom: 40px !important;
          }
          .biz-divider {
            margin-bottom: 40px !important;
          }
          .biz-cta {
            padding: 28px 16px !important;
          }
        }

        @media (max-width: 480px) {
          .navbar_logo {
            font-size: 1.15rem !important;
          }
          .biz-copy-btn {
            width: 100% !important;
            justify-content: center !important;
            font-size: 0.8rem !important;
            padding: 12px 8px !important;
          }
          .biz-benefits {
            grid-template-columns: 1fr !important;
          }
          .biz-steps {
            grid-template-columns: 1fr !important;
          }
          .biz-cta-h3 {
            font-size: 1.15rem !important;
          }
          .biz-cta-sub {
            font-size: 0.8rem !important;
          }
        }
      `}</style>
      <style dangerouslySetInnerHTML={{__html: `
        body, html { overflow: hidden !important; margin: 0 !important; padding: 0 !important; background: white !important; height: 100% !important; }
      `}} />

      <div className="page-wrapper" style={{ position: 'absolute', top: '12px', bottom: '12px', left: '12px', right: '12px', overflowY: 'auto', borderRadius: '24px', margin: 0 }}>
        <div className="biz-root" style={{
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
          <div className="biz-hero">
            <div className="biz-eyebrow">For Teams &amp; Businesses</div>
            <h1 className="biz-h1" style={{ textShadow: '0 4px 16px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 0, 0, 0.6)' }}>
              Your team is drowning<br/>
              <em>in the same spam.</em>
            </h1>
            <p className="biz-sub">
              One forward address. Zero setup. The whole company finally stops fighting the same inbox battles — individually.
            </p>
          </div>

          {/* Problem Cards */}
          <div className="biz-section">
            <p className="biz-section-label">The cost nobody&apos;s tracking</p>
            <div className="biz-problems">
              {problems.map((p) => (
                <div key={p.title} className="biz-problem-card">
                  <div className="biz-problem-icon">{p.icon}</div>
                  <div className="biz-problem-title">{p.title}</div>
                  <div className="biz-problem-body">{p.body}</div>
                </div>
              ))}
            </div>
          </div>

          <hr className="biz-divider" />

          {/* How it works */}
          <div className="biz-solution">
            <p className="biz-section-label">How it works</p>
            <h2 className="biz-solution-h2" style={{ textShadow: '0 4px 16px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 0, 0, 0.6)' }}>Three steps. Done in under a minute.</h2>
            <p className="biz-solution-sub">
              No integration, no contract, no onboarding call. If your team can forward an email, they&apos;re set up.
            </p>

            <div className="biz-steps">
              {steps.map((s) => (
                <div key={s.number} className="biz-step">
                  <div className="biz-step-number">{s.number}</div>
                  <div className="biz-step-title">{s.title}</div>
                  <div className="biz-step-body">{s.body}</div>
                </div>
              ))}
            </div>

            {/* Outlook forward mockup */}
            <div className="biz-outlook-wrap">
              <span className="biz-outlook-label">step 2 in action — just hit forward</span>
              <div className="biz-outlook-frame">

                {/* Title bar */}
                <div className="ol-titlebar">
                  <div className="ol-titlebar-left">
                    <div className="ol-app-icon">O</div>
                    <span className="ol-title-text">FW: You&apos;re subscribed to our weekly digest — Message (HTML)</span>
                  </div>
                  <div className="ol-titlebar-actions">
                    <span className="ol-tb-action">&#8722;</span>
                    <span className="ol-tb-action">&#9633;</span>
                    <span className="ol-tb-action ol-tb-close">&#215;</span>
                  </div>
                </div>

                {/* Ribbon */}
                <div className="ol-ribbon">
                  <div className="ol-ribbon-btn ol-ribbon-btn-primary">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Send
                  </div>
                  <div className="ol-ribbon-sep" />
                  <div className="ol-ribbon-btn">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>
                    Forward
                  </div>
                  <div className="ol-ribbon-btn">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    Attach
                  </div>
                </div>

                {/* Compose fields */}
                <div className="ol-compose">
                  <div className="ol-field">
                    <span className="ol-field-label">To</span>
                    <span className="ol-field-value">
                      <span className="ol-address-chip">
                        <span className="ol-address-chip-avatar">U</span>
                        Unsubscribe@unsubhero.com
                      </span>
                    </span>
                  </div>
                  <div className="ol-field">
                    <span className="ol-field-label">Cc</span>
                    <span className="ol-field-value" style={{ color: '#ccc' }}>Add a contact</span>
                  </div>
                  <div className="ol-field">
                    <span className="ol-field-label">Subj</span>
                    <span className="ol-subject-value">FW: You&apos;re subscribed to our weekly digest</span>
                  </div>

                  {/* Body */}
                  <div className="ol-body-area">
                    <div className="ol-fwd-label">
                      <span className="ol-fwd-line" />
                      <span>Forwarded Message</span>
                      <span className="ol-fwd-line" />
                    </div>
                    <div className="ol-fwd-meta">
                      <strong>From:</strong> Weekly Digest &lt;noreply@newsletter.io&gt;<br/>
                      <strong>To:</strong> james@userevidence.com<br/>
                      <strong>Subject:</strong> You&apos;re subscribed to our weekly digest
                    </div>
                    <div className="ol-fwd-body-text">
                      Hi James, thanks for signing up! Here&apos;s your weekly roundup of top stories...
                    </div>
                  </div>
                </div>

                {/* Status bar */}
                <div className="ol-statusbar">
                  <div className="ol-status-dot" />
                  <span className="ol-status-text">Connected to Microsoft Exchange &mdash; unsubhero.com will handle the opt-out automatically</span>
                </div>

              </div>
            </div>
          </div>

          <hr className="biz-divider" />

          {/* Why it works */}
          <div className="biz-solution">
            <p className="biz-section-label">Why it works</p>
            <h2 className="biz-solution-h2" style={{ textShadow: '0 4px 16px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 0, 0, 0.6)' }}>No IT ticket. No approval needed.</h2>
            <p className="biz-solution-sub">
              Share one email address with your team and everyone is covered. No per-seat billing, no admin panel to babysit.
            </p>

            <div className="biz-benefits">
              {benefits.map((b) => (
                <div key={b.label} className="biz-benefit">
                  <div className="biz-benefit-top">
                    {b.icon}
                    <span className="biz-benefit-label">{b.label}</span>
                  </div>
                  <span className="biz-benefit-sub">{b.sub}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="biz-cta">
              <h3 className="biz-cta-h3">Share it with your team today.</h3>
              <p className="biz-cta-sub">
                Copy the address below, paste it into your next team message, and you&apos;re done.<br/>
                That&apos;s the entire rollout.
              </p>
              <button className="biz-copy-btn" onClick={handleCopy}>
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
