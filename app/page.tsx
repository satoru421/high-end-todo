"use client";

import { motion } from "framer-motion";

// シリコンバレー基準の滑らかなイージング
const ease = [0.22, 1, 0.36, 1] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const navItems = ["ToDo", "Calendar", "Focus"];

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-midnight-950 px-6 py-10 font-sans text-ghost-white sm:px-8">
      {/* 背景：中心から滲み出すような微細な光の階調 */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03)_0%,rgba(5,5,5,0.95)_50%,rgba(2,2,3,1)_100%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease }}
      />

      <motion.section
        // カード：不均一なボーダーで光源を演出。bgの不透明度を極限まで下げる
        className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-between gap-10 rounded-[2.5rem] border-t border-white/10 border-x border-white/5 border-b border-white/5 bg-white/[0.02] px-6 py-12 shadow-2xl backdrop-blur-[32px] sm:px-10 sm:py-14"
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 1.2, ease }}
      >
        <motion.div 
          className="space-y-6 text-center"
          variants={fadeInUp}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[10px] tracking-ultra-wide text-slate-500 uppercase">
            AETERNA • Zen Dashboard
          </p>
          <h1 className="font-serif text-3xl font-extralight tracking-luxury text-ghost-white/90 sm:text-4xl md:text-5xl lg:leading-snug">
            今日、君が命を懸けるべき
            <span className="mt-2 block text-ghost-white font-normal">一つのこと</span>
          </h1>
        </motion.div>

        <motion.textarea
          className="h-56 w-full resize-none rounded-3xl border-t border-white/10 border-x border-white/5 border-b border-white/5 bg-white/[0.01] p-10 text-xl font-light leading-relaxed text-ghost-white placeholder:text-slate-600 outline-none backdrop-blur-xl transition-all duration-700 focus:bg-white/[0.03] focus:border-white/20 sm:h-72 sm:text-2xl"
          placeholder="この静寂の中で、最も重要な決断を下す。"
          variants={fadeInUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 1, delay: 0.24, ease }}
          whileFocus={{ scale: 1.005, y: -2 }}
        />

        <motion.nav
          className="fixed inset-x-0 bottom-10 z-20 mx-auto flex w-fit items-center gap-1 rounded-full border border-white/5 bg-black/20 p-1.5 shadow-2xl backdrop-blur-2xl"
          variants={fadeInUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 1, delay: 0.36, ease }}
        >
          {navItems.map((item) => (
            <motion.button
              key={item}
              type="button"
              className="rounded-full px-8 py-2.5 text-[12px] tracking-[0.2em] text-slate-400 transition-all duration-500 hover:text-ghost-white"
              whileHover={{ 
                backgroundColor: "rgba(255,255,255,0.05)",
                y: -1
              }}
              whileTap={{ scale: 0.98 }}
            >
              {item}
            </motion.button>
          ))}
        </motion.nav>
      </motion.section>
    </main>
  );
}