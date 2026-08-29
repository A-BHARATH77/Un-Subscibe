"use client";

import { useEffect, useState } from "react";

export default function Loader({ onComplete }: { onComplete: () => void }) {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    // At 2.2s the panel starts sliding out — reveal home page underneath
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2200);

    // At 3.0s the panel has fully exited — unmount the loader
    const unmountTimer = setTimeout(() => {
      setMounted(false);
    }, 3000);

    return () => {
      clearTimeout(completeTimer);
      clearTimeout(unmountTimer);
    };
  }, [onComplete]);

  if (!mounted) return null;

  return (
    <div className="loader-root">
      {/* Sleek dark background that fades out when the wipe-out starts */}
      <div className="loader-bg" />

      {/* Single white wipe panel — slides up from bottom, holds, then slides up and out */}
      <div className="loader-panel">

        {/* Brand text sits inside the panel so it travels with it */}
        <div className="loader-text">
          <h1 className="loader-title">Unsub Hero</h1>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap');

        /* ── Root overlay ── */
        .loader-root {
          position: fixed;
          inset: 0;
          z-index: 999999;
          pointer-events: none;
          overflow: hidden;
        }

        /* ── Sleek dark background behind the panel ── */
        .loader-bg {
          position: absolute;
          inset: 0;
          background-color: #050505;
          z-index: 1;
          animation: bgTimeline 3.0s ease forwards;
        }

        /* ── Single white panel ── */
        .loader-panel {
          position: absolute;
          inset: 0;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;

          /*
            3-phase single keyframe:
              0%      → starts off-screen at bottom
              ~26.6%  → covers the screen (0.8s in)
              ~73.3%  → holds with text visible
              100%    → exits off-screen at top (ends at 3.0s)
          */
          animation: loaderWipe 3.0s cubic-bezier(0.76, 0, 0.24, 1) forwards;
        }

        /* ── Brand text ── */
        .loader-text {
          animation: loaderText 3.0s ease forwards;
        }

        .loader-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 3.5rem;
          font-weight: 800;
          color: #000000;
          letter-spacing: -0.03em;
          text-align: center;
          margin: 0;
          line-height: 1;
        }

        /* ── Keyframes ── */
        @keyframes bgTimeline {
          0%      { opacity: 1; }
          73.3%   { opacity: 1; } /* Remains dark until 2.2s when wipe-out starts */
          100%    { opacity: 0; } /* Fades to transparent as panel exits */
        }

        @keyframes loaderWipe {
          0%      { transform: translateY(100%); }
          26.6%   { transform: translateY(0%);   }
          73.3%   { transform: translateY(0%);   }
          100%    { transform: translateY(-100%);}
        }

        @keyframes loaderText {
          /* hidden while panel is rising */
          0%    { opacity: 0; transform: translateY(12px); }
          26.6% { opacity: 0; transform: translateY(12px); }
          /* fades in once panel is settled */
          40%   { opacity: 1; transform: translateY(0);    }
          /* holds */
          66%   { opacity: 1; transform: translateY(0);    }
          /* fades out just before panel exits */
          80%   { opacity: 0; transform: translateY(-8px); }
          100%  { opacity: 0; transform: translateY(-8px); }
        }

        @media (max-width: 768px) {
          .loader-title { font-size: 2.2rem; }
        }
      `}} />
    </div>
  );
}
