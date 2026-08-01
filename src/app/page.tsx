"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { LogIn, LineChart, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import AppIntro from "./components/AppIntro";

const options = [
  {
    id: "broker-login",
    title: "Broker Portal",
    subtitle: "Manage accounts securely",
    icon: LogIn,
    color: "from-emerald-500/20 via-emerald-500/10 to-emerald-600/20",
    glow: "rgba(34,197,94,0.3)",
    route: "/login",
    gradient: "bg-gradient-to-br from-[var(--success)]/10 to-[var(--success)]/5"
  },
  {
    id: "trade-login",
    title: "Trade Workspace",
    subtitle: "Live market access",
    icon: LineChart,
    color: "from-amber-500/20 via-amber-500/10 to-amber-600/20",
    glow: "rgba(251,146,60,0.3)",
    route: "/trade-login",
    gradient: "bg-gradient-to-br from-[var(--warning)]/10 to-[var(--warning)]/5"
  }
];

export default function Home() {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useEffect(() => {
    const introShown = sessionStorage.getItem("fp-trades-intro-shown");

    if (introShown === "1") {
      setShowIntro(false);
      return;
    }

    sessionStorage.setItem("fp-trades-intro-shown", "1");
    setShowIntro(true);
  }, []);

  const handleIntroFinish = () => {
    setShowIntro(false);
  };

  if (showIntro === null) {
    return <div className="min-h-screen bg-[var(--bg-plan)] md:bg-[var(--bg-main)]" />;
  }

  return (
    <>
      {showIntro && <AppIntro onFinish={handleIntroFinish} />}
      <div className="min-h-screen bg-[var(--bg-plan)] md:bg-[var(--bg-main)] text-[var(--text-main)] relative overflow-hidden flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 pointer-events-none hidden md:block bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.08),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(22,163,74,0.06),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(217,119,6,0.06),transparent_45%)]" />

        {!showIntro && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md md:max-w-4xl mx-auto space-y-6 md:space-y-10"
          >
            {isDesktop ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center mb-12"
                >
                  <span className="inline-flex items-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)]/80 px-4 py-1.5 text-xs font-semibold tracking-wide mb-4">
                    FP Trades
                  </span>
                  <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[var(--text-main)] via-[var(--primary)] to-[var(--text-muted)] bg-clip-text text-transparent mb-4">
                    Trading Hub
                  </h1>
                  <p className="text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
                    Choose your access point
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-6">
                  {options.map((option, index) => (
                    <motion.button
                      key={`desktop-${option.id}`}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(option.route)}
                      className={`
                        group relative h-64 rounded-3xl p-8 overflow-hidden
                        border border-[var(--border-soft)]
                        bg-[var(--bg-card)] backdrop-blur-xl
                        shadow-xl hover:shadow-2xl
                        transition-all duration-500
                        ${option.gradient}
                      `}
                    >
                      <motion.div
                        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-150%] group-hover:translate-x-[150%]"
                        transition={{ duration: 0.8 }}
                      />

                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ boxShadow: `inset 0 0 50px ${option.glow}` }}
                      />

                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <motion.div
                          className={`
                            w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center
                            shadow-xl backdrop-blur-xl border border-[var(--border-glass)]
                            bg-gradient-to-br ${option.color}
                          `}
                          whileHover={{ scale: 1.08, rotate: 4 }}
                        >
                          <option.icon size={32} className="drop-shadow-lg" />
                        </motion.div>

                        <div className="text-center flex-1 flex flex-col justify-center">
                          <h3 className="text-2xl font-bold mb-3">{option.title}</h3>
                          <p className="text-[var(--text-muted)] text-sm leading-relaxed">{option.subtitle}</p>
                        </div>

                        <motion.div
                          className="w-12 h-12 bg-[var(--primary)] text-white rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl ml-auto"
                          whileHover={{ scale: 1.15, x: 8 }}
                        >
                          <ChevronRight size={24} />
                        </motion.div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-4 max-h-screen overflow-hidden">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center mb-8"
                >
                  <span className="inline-flex items-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)]/85 px-3.5 py-1 text-[11px] font-semibold tracking-wide mb-3">
                    FP Trades
                  </span>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-[var(--text-main)] via-[var(--primary)] to-[var(--text-muted)] bg-clip-text text-transparent mb-4">
                    Trading Hub
                  </h1>
                  <p className="text-base text-[var(--text-muted)] max-w-2xl mx-auto">
                    Choose your access point
                  </p>
                </motion.div>
                {options.map((option, index) => (
                  <motion.button
                    key={`mobile-${option.id}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => router.push(option.route)}
                    className={`
                      group relative h-28 w-full rounded-2xl p-5 overflow-hidden
                      border border-[var(--border-soft)]
                      bg-[var(--bg-card)] backdrop-blur-lg
                      shadow-lg hover:shadow-xl
                      transition-all duration-400
                      ${option.gradient}
                    `}
                  >
                    <motion.div
                      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-120%] group-hover:translate-x-[120%]"
                      transition={{ duration: 0.6 }}
                    />

                    <div className="relative z-10 flex items-center justify-between h-full">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`
                            h-12 w-12 rounded-xl flex items-center justify-center
                            shadow-lg backdrop-blur-lg border border-[var(--border-glass)]
                            bg-gradient-to-br ${option.color}
                          `}
                        >
                          <option.icon size={22} className="drop-shadow-sm" />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="text-lg font-bold truncate">{option.title}</div>
                          <div className="text-xs text-[var(--text-muted)] line-clamp-2">{option.subtitle}</div>
                        </div>
                      </div>
                      <motion.div
                        className="text-[var(--primary)] opacity-70 group-hover:opacity-100 ml-2"
                        whileHover={{ scale: 1.2 }}
                      >
                        <ChevronRight size={20} />
                      </motion.div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}
