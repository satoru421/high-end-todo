"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;
const STORAGE_KEY = "aeterna.command-center.v2";
type ViewMode = "Zen" | "Today" | "ToDo" | "Calendar" | "Focus";
type CalendarSpan = "day" | "week" | "month" | "year";
type GoalMap = Record<CalendarSpan, string>;
type TodoItem = { id: string; title: string; time: string };

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const navItems: ViewMode[] = ["Zen", "Today", "ToDo", "Calendar", "Focus"];
const spans: CalendarSpan[] = ["day", "week", "month", "year"];
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

function readStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      activeView: ViewMode;
      zenCommitment: string;
      todayNote: string;
      todoDraft: string;
      todoTime: string;
      todos: TodoItem[];
      calendarSpan: CalendarSpan;
      goals: GoalMap;
      focusNote: string;
    };
  } catch {
    return null;
  }
}

export default function Home() {
  const initial = readStorage();
  const [activeView, setActiveView] = useState<ViewMode>(initial?.activeView ?? "Zen");
  const [zenCommitment, setZenCommitment] = useState(
    initial?.zenCommitment ?? "この静寂の中で、最も重要な決断を下す。",
  );
  const [todayNote, setTodayNote] = useState(initial?.todayNote ?? "");
  const [todoDraft, setTodoDraft] = useState(initial?.todoDraft ?? "");
  const [todoTime, setTodoTime] = useState(initial?.todoTime ?? "09:00");
  const [todos, setTodos] = useState<TodoItem[]>(
    initial?.todos ?? [
      { id: "seed-1", title: "Board sync", time: "09:00" },
      { id: "seed-2", title: "Deep work block", time: "14:00" },
    ],
  );
  const [calendarSpan, setCalendarSpan] = useState<CalendarSpan>(initial?.calendarSpan ?? "day");
  const [goals, setGoals] = useState<GoalMap>(
    initial?.goals ?? { day: "", week: "", month: "", year: "" },
  );
  const [focusNote, setFocusNote] = useState(initial?.focusNote ?? "");

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeView,
        zenCommitment,
        todayNote,
        todoDraft,
        todoTime,
        todos,
        calendarSpan,
        goals,
        focusNote,
      }),
    );
  }, [activeView, zenCommitment, todayNote, todoDraft, todoTime, todos, calendarSpan, goals, focusNote]);

  const timelineByHour = useMemo(() => {
    return hours.map((hour) => {
      const bucket = todos.filter((todo) => todo.time.slice(0, 2) === hour.slice(0, 2));
      return { hour, bucket };
    });
  }, [todos]);

  const densityGrid = useMemo(() => {
    const cellCount = calendarSpan === "year" ? 48 : 35;
    const factor = todos.length + goals[calendarSpan].length;
    return Array.from({ length: cellCount }, (_, idx) => ((idx * 7 + factor) % 5) as 0 | 1 | 2 | 3 | 4);
  }, [calendarSpan, todos.length, goals]);

  function addTodo() {
    if (!todoDraft.trim()) return;
    setTodos((prev) => [{ id: crypto.randomUUID(), title: todoDraft.trim(), time: todoTime }, ...prev]);
    setTodoDraft("");
  }

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
          <h1 className="font-serif text-3xl font-extralight text-ghost-white/90 sm:text-4xl md:text-5xl lg:leading-snug">
            {activeView === "Zen" && "今日、君が命を懸けるべき"}
            {activeView === "Today" && "Today Timeline"}
            {activeView === "ToDo" && "Command List"}
            {activeView === "Calendar" && "Strategic Calendar"}
            {activeView === "Focus" && "Focus Ritual"}
            <span className="mt-2 block font-normal text-ghost-white">
              {activeView === "Zen" ? "一つのこと" : "AETERNA"}
            </span>
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeView === "Zen" ? (
            <motion.section
              key="zen"
              className="h-56 w-full rounded-3xl border-t border-white/10 border-x border-white/5 border-b border-white/5 bg-white/[0.01] p-10 text-xl font-light leading-relaxed text-ghost-white backdrop-blur-xl sm:h-72 sm:text-2xl"
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
              transition={{ duration: 0.75, ease }}
            >
              <textarea
                value={zenCommitment}
                onChange={(event) => setZenCommitment(event.target.value)}
                className="h-full w-full resize-none bg-transparent text-xl font-light leading-relaxed outline-none placeholder:text-slate-600 sm:text-2xl"
                placeholder="今日、君が命を懸けるべき一つのことを定義する。"
              />
            </motion.section>
          ) : null}

          {activeView === "Today" ? (
            <motion.section
              key="today"
              className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
              transition={{ duration: 0.8, ease }}
            >
              <p className="mb-4 text-xs uppercase tracking-[0.28em] text-slate-400">24h Timeline</p>
              <textarea
                value={todayNote}
                onChange={(event) => setTodayNote(event.target.value)}
                className="mb-4 h-16 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-slate-500"
                placeholder="Todayの戦術メモ..."
              />
              <div className="max-h-64 space-y-2 overflow-auto pr-1">
                {timelineByHour.map(({ hour, bucket }) => (
                  <div key={hour} className="grid grid-cols-[60px,1fr] items-center gap-2">
                    <span className="text-xs text-slate-500">{hour}</span>
                    <div className="min-h-8 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5">
                      {bucket.length === 0 ? (
                        <div className="h-2 w-full rounded-full bg-white/[0.03]" />
                      ) : (
                        <div className="space-y-1">
                          {bucket.map((item) => (
                            <p
                              key={item.id}
                              className="rounded-lg border border-white/15 bg-white/[0.06] px-2 py-1 text-xs shadow-[0_0_16px_rgba(233,236,255,0.3)]"
                            >
                              {item.title}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          ) : null}

          {activeView === "ToDo" ? (
            <motion.div
              key="todo"
              className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
              transition={{ duration: 0.8, ease }}
            >
              <p className="mb-4 text-xs uppercase tracking-[0.28em] text-slate-400">Tactical ToDo</p>
              <div className="mb-4 grid gap-2 sm:grid-cols-[1fr,120px,auto]">
                <input
                  value={todoDraft}
                  onChange={(event) => setTodoDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addTodo();
                  }}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm outline-none placeholder:text-slate-500"
                  placeholder="Add command..."
                />
                <input
                  value={todoTime}
                  onChange={(event) => setTodoTime(event.target.value)}
                  type="time"
                  className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={addTodo}
                  className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs uppercase tracking-[0.2em]"
                >
                  Add
                </button>
              </div>
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div key={todo.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-sm text-ghost-white">{todo.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{todo.time}</p>
                  </div>
                ))}
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
              exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
              transition={{ duration: 0.8, ease }}
            >
              <div className="mb-4 flex w-full gap-1 rounded-2xl border border-white/10 bg-black/25 p-1">
                {spans.map((span) => (
                  <button
                    key={span}
                    type="button"
                    onClick={() => setCalendarSpan(span)}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs uppercase tracking-[0.2em] transition ${
                      calendarSpan === span ? "bg-white/10 text-ghost-white" : "text-slate-400"
                    }`}
                  >
                    {span}
                  </button>
                ))}
              </div>

              <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                  {calendarSpan} Goal
                </p>
                <textarea
                  value={goals[calendarSpan]}
                  onChange={(event) =>
                    setGoals((prev) => ({ ...prev, [calendarSpan]: event.target.value }))
                  }
                  className="h-20 w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-slate-500"
                  placeholder={`${calendarSpan}で達成すべき最重要目標を定義`}
                />
              </div>

              {calendarSpan === "month" || calendarSpan === "year" ? (
                <div className="grid grid-cols-7 gap-2">
                  {densityGrid.map((level, idx) => (
                    <div
                      key={`${calendarSpan}-${idx}`}
                      className={`aspect-square rounded-lg border border-white/10 ${
                        level === 0 && "bg-white/[0.02]"
                      } ${level === 1 && "bg-white/[0.04]"} ${
                        level === 2 && "bg-white/[0.06] shadow-[0_0_12px_rgba(236,240,255,0.2)]"
                      } ${level === 3 && "bg-white/[0.1] shadow-[0_0_16px_rgba(236,240,255,0.28)]"} ${
                        level === 4 && "bg-white/[0.14] shadow-[0_0_22px_rgba(236,240,255,0.38)]"
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {hours.slice(8, 20).map((hour) => (
                    <div key={hour} className="grid grid-cols-[60px,1fr] items-center gap-2">
                      <span className="text-xs text-slate-500">{hour}</span>
                      <div className="h-7 rounded-xl border border-white/10 bg-white/[0.03]" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : null}

          {activeView === "Focus" ? (
            <motion.section
              key="focus"
              className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
              transition={{ duration: 0.8, ease }}
            >
              <p className="mb-4 text-xs uppercase tracking-[0.28em] text-slate-400">Deep Focus</p>
              <textarea
                value={focusNote}
                onChange={(event) => setFocusNote(event.target.value)}
                className="h-48 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-4 text-base outline-none placeholder:text-slate-500"
                placeholder="雑音を遮断し、ここに集中儀式を書き出す。"
              />
            </motion.section>
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