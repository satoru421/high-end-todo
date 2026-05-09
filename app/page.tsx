"use client";

// trigger deploy
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;
type ViewMode = "Zen" | "ToDo" | "Calendar";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const navItems: ViewMode[] = ["Zen", "ToDo", "Calendar"];

export default function Home() {
  const [activeView, setActiveView] = useState<ViewMode>("Zen");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-midnight-950 px-6 py-10 font-sans text-ghost-white sm:px-8">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03)_0%,rgba(5,5,5,0.95)_50%,rgba(2,2,3,1)_100%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease }}
      />

      <motion.section
        className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-between gap-8 rounded-[2.5rem] border-t border-white/10 border-x border-white/5 border-b border-white/5 bg-white/[0.02] px-6 py-12 shadow-2xl backdrop-blur-[32px] sm:px-10 sm:py-14"
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 1.2, ease }}
      >
        <motion.div className="space-y-6 text-center" variants={fadeInUp} transition={{ delay: 0.1 }}>
          <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
            AETERNA • {activeView} View
          </p>
          {activeView === "Zen" ? (
            <h1 className="font-serif text-3xl font-extralight text-ghost-white/90 sm:text-4xl md:text-5xl lg:leading-snug">
              今日、君が命を懸けるべき
              <span className="mt-2 block font-normal text-ghost-white">一つのこと</span>
            </h1>
          ) : (
            <h1 className="font-serif text-3xl font-extralight text-ghost-white/90 sm:text-4xl md:text-5xl lg:leading-snug">
              {activeView === "ToDo" ? "Command List" : "Today Timeline"}
            </h1>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {activeView === "Zen" ? (
            <motion.section
              key="zen"
              className="h-56 w-full rounded-3xl border-t border-white/10 border-x border-white/5 border-b border-white/5 bg-white/[0.01] p-10 text-xl font-light leading-relaxed text-ghost-white backdrop-blur-xl sm:h-72 sm:text-2xl"
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.8, ease }}
            >
              <p className="line-clamp-5">この静寂の中で、最も重要な決断を下す。</p>
            </motion.section>
          ) : null}

          {activeView === "ToDo" ? (
            <motion.div
              key="todo"
              className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.8, ease }}
            >
              <p className="mb-4 text-xs uppercase tracking-[0.28em] text-slate-400">ToDo Placeholder</p>
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-sm text-ghost-white">Must-Win task card</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-4">
                  <p className="text-sm text-slate-300">Other task card</p>
                </div>
              </div>
            </motion.div>
          ) : null}

          {activeView === "Calendar" ? (
            <motion.div
              key="calendar"
              className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.8, ease }}
            >
              <p className="mb-4 text-xs uppercase tracking-[0.28em] text-slate-400">Calendar Placeholder</p>
              <div className="grid gap-2">
                {["09:00", "12:00", "15:00", "18:00"].map((time) => (
                  <div key={time} className="grid grid-cols-[70px,1fr] items-center gap-2">
                    <span className="text-xs text-slate-500">{time}</span>
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 shadow-[0_0_20px_rgba(232,236,255,0.2)]">
                      <p className="text-sm text-ghost-white/90">Timeline block</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.section>

      <motion.nav
        className="fixed inset-x-0 bottom-8 z-40 mx-auto flex w-fit items-center gap-1 rounded-full border border-white/5 bg-black/35 p-1.5 shadow-2xl backdrop-blur-2xl"
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 1, delay: 0.36, ease }}
      >
        {navItems.map((item) => (
          <motion.button
            key={item}
            type="button"
            onClick={() => {
              setActiveView(item);
            }}
            className={`rounded-full px-7 py-2.5 text-[12px] tracking-[0.18em] transition-all duration-500 ${
              activeView === item
                ? "bg-white/10 text-ghost-white"
                : "text-slate-400 hover:text-ghost-white"
            }`}
            whileHover={{
              backgroundColor:
                activeView === item ? "rgba(255,255,255,0.11)" : "rgba(255,255,255,0.05)",
              y: -1,
            }}
            whileTap={{ scale: 0.98 }}
          >
            {item}
          </motion.button>
        ))}
      </motion.nav>
    </main>
  );
}