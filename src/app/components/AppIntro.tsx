"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface Props {
  onFinish: () => void;
}

export default function AppIntro({ onFinish }: Props) {
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const node = taglineRef.current;

    const handleEnd = () => {
      setFadeOut(true);
      setTimeout(() => {
        onFinish();
      }, 800); // Increased for smoother fade
    };

    node?.addEventListener("animationend", handleEnd);

    return () => {
      node?.removeEventListener("animationend", handleEnd);
    };
  }, [onFinish]);

 return (
  <div
    className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden
    bg-[var(--bg-main)] transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
    ${fadeOut ? "opacity-0 scale-[0.96] blur-sm" : "opacity-100 scale-100"}
    `}
  >
    {/* Subtle depth gradient background */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--primary-glow),transparent_60%)] opacity-40" />

    {/* Soft noise texture layer */}
    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none " />

    <div className="relative flex flex-col items-center text-center">

      {/* LOGO */}
      <div className="relative mb-14 animate-logoEntrance">

        {/* Controlled glow */}
        <div className="absolute inset-0 rounded-[2rem] bg-[var(--primary-glow)] blur-[60px] opacity-60 animate-glowControlled" />

        <div className="relative bg-[var(--bg-card)]/80 backdrop-blur-2xl border border-[var(--border-glass)] rounded-[2rem] p-8 shadow-[0_25px_80px_var(--primary-glow)]">

          <Image
            src="/fp-logo.png?v=fp-trades-20260730"
            alt="FP Trades"
            width={120}
            height={120}
            priority
          />

        </div>

        {/* Light sweep */}
        <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
          <div className="absolute w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent# skew-x-12 animate-lightSweep" />
        </div>
      </div>

      {/* BRAND NAME */}
      <h1 className="text-4xl font-semibold tracking-[0.35em] text-[var(--text-main)] mb-6 flex">
        {"FP Trades".split("").map((char, i) => (
          <span key={i} className="letter-advanced">{char}</span>
        ))}
      </h1>

      {/* TAGLINE */}
      <p
        ref={taglineRef}
        className="text-sm tracking-[0.4em] text-[var(--text-muted)] uppercase tagline-advanced"
      >
        Institutional Precision • Strategic Intelligence • Market Authority
      </p>

    </div>
  </div>
);
}
