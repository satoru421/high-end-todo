"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;
const STORAGE_KEY = "aeterna.tasks.v1";

type Priority = "high" | "medium" | "low";
type TaskStatus = "todo" | "done";
type ViewMode = "ToDo" | "Calendar" | "Focus";

type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  scheduledTime: string;
  isMustWin: boolean;
};

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const navItems: ViewMode[] = ["ToDo", "Calendar", "Focus"];
const hourTicks = Array.from({ length: 24 }, (_, hour) => hour);

const defaultTasks: Task[] = [
  {
    id: "seed-1",
    title: "Board deck finalize",
    description: "投資家ミーティング用に、最終スライドの論点を磨く。",
    priority: "high",
    status: "todo",
    scheduledTime: "09:30",
    isMustWin: true,
  },
  {
    id: "seed-2",
    title: "Product sync",
    description: "次スプリントのスコープを5分で意思決定する。",
    priority: "medium",
    status: "todo",
    scheduledTime: "14:00",
    isMustWin: false,
  },
];

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

function taskPriorityTone(priority: Priority): string {
  if (priority === "high") return "text-rose-200";
  if (priority === "medium") return "text-amber-200";
  return "text-emerald-200";
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewMode>("ToDo");
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === "undefined") return defaultTasks;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultTasks;
      const parsed = JSON.parse(raw) as Task[];
      return Array.isArray(parsed) ? parsed : defaultTasks;
    } catch {
      return defaultTasks;
    }
  });

  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [priorityInput, setPriorityInput] = useState<Priority>("high");
  const [timeInput, setTimeInput] = useState("09:00");
  const [mustWinInput, setMustWinInput] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const mustWinTasks = useMemo(
    () => tasks.filter((task) => task.isMustWin && task.status === "todo"),
    [tasks],
  );
  const otherTasks = useMemo(
    () => tasks.filter((task) => !task.isMustWin && task.status === "todo"),
    [tasks],
  );

  function resetComposer() {
    setTitleInput("");
    setDescriptionInput("");
    setPriorityInput("high");
    setTimeInput("09:00");
    setMustWinInput(true);
  }

  function createTask() {
    const title = titleInput.trim();
    if (!title) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description: descriptionInput.trim(),
      priority: priorityInput,
      status: "todo",
      scheduledTime: timeInput,
      isMustWin: mustWinInput,
    };
    setTasks((prev) => [newTask, ...prev]);
    resetComposer();
  }

  function saveTask(id: string) {
    const title = titleInput.trim();
    if (!title) return;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              title,
              description: descriptionInput.trim(),
              priority: priorityInput,
              scheduledTime: timeInput,
              isMustWin: mustWinInput,
            }
          : task,
      ),
    );
    setEditingId(null);
    resetComposer();
  }

  function beginEdit(task: Task) {
    setEditingId(task.id);
    setTitleInput(task.title);
    setDescriptionInput(task.description);
    setPriorityInput(task.priority);
    setTimeInput(task.scheduledTime);
    setMustWinInput(task.isMustWin);
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    if (editingId === id) {
      setEditingId(null);
      resetComposer();
    }
  }

  function toggleTaskDone(id: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, status: task.status === "done" ? "todo" : "done" }
          : task,
      ),
    );
  }

  const commitment = mustWinTasks[0]?.title ?? "最優先タスクをここに定義してください。";

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
            AETERNA • Zen Dashboard
          </p>
          <h1 className="font-serif text-3xl font-extralight text-ghost-white/90 sm:text-4xl md:text-5xl lg:leading-snug">
            今日、君が命を懸けるべき
            <span className="mt-2 block font-normal text-ghost-white">一つのこと</span>
          </h1>
        </motion.div>

        <motion.div
          className="h-56 w-full rounded-3xl border-t border-white/10 border-x border-white/5 border-b border-white/5 bg-white/[0.01] p-10 text-xl font-light leading-relaxed text-ghost-white backdrop-blur-xl sm:h-72 sm:text-2xl"
          variants={fadeInUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 1, delay: 0.24, ease }}
        >
          <p className="line-clamp-5">{commitment}</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeView === "ToDo" ? (
            <motion.section
              key="todo"
              className="w-full space-y-5"
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.8, ease }}
            >
              <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
                <input
                  value={titleInput}
                  onChange={(event) => setTitleInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (editingId) {
                        saveTask(editingId);
                        return;
                      }
                      createTask();
                    }
                  }}
                  placeholder="Task title (Enter で追加)"
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-white/20"
                />
                <input
                  value={timeInput}
                  onChange={(event) => setTimeInput(event.target.value)}
                  type="time"
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/20"
                />
                <input
                  value={descriptionInput}
                  onChange={(event) => setDescriptionInput(event.target.value)}
                  placeholder="Description"
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-white/20 sm:col-span-2"
                />
                <div className="flex items-center gap-2">
                  {(["high", "medium", "low"] as Priority[]).map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setPriorityInput(priority)}
                      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition ${
                        priorityInput === priority
                          ? "border-white/30 bg-white/10 text-ghost-white"
                          : "border-white/10 text-slate-400"
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setMustWinInput((prev) => !prev)}
                  className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wide transition ${
                    mustWinInput
                      ? "border-white/30 bg-white/10 text-ghost-white"
                      : "border-white/10 text-slate-400"
                  }`}
                >
                  Must-Win
                </button>
                <div className="flex gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (editingId) {
                        saveTask(editingId);
                        return;
                      }
                      createTask();
                    }}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.16em]"
                  >
                    {editingId ? "Save" : "Add"}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        resetComposer();
                      }}
                      className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.16em] text-slate-400"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </div>

              <TaskLane
                title="Must-Win"
                tasks={mustWinTasks}
                onEdit={beginEdit}
                onDelete={removeTask}
                onComplete={toggleTaskDone}
              />
              <TaskLane
                title="Others"
                tasks={otherTasks}
                onEdit={beginEdit}
                onDelete={removeTask}
                onComplete={toggleTaskDone}
              />
            </motion.section>
          ) : null}
        </AnimatePresence>
      </motion.section>

      <AnimatePresence>
        {activeView === "Calendar" ? (
          <motion.section
            className="fixed inset-0 z-30 bg-black/75 px-4 pb-28 pt-16 sm:px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease }}
          >
            <motion.div
              className="mx-auto h-full max-w-4xl overflow-auto rounded-[2rem] border border-white/10 bg-black/55 p-6 backdrop-blur-xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.75, ease, delay: 0.2 }}
            >
              <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-slate-400">
                Today Timeline
              </p>
              <div className="space-y-4">
                {hourTicks.map((hour) => {
                  const hourTasks = tasks.filter(
                    (task) =>
                      task.status === "todo" &&
                      Number(task.scheduledTime.split(":")[0]) === hour,
                  );
                  return (
                    <div key={hour} className="grid grid-cols-[64px,1fr] items-start gap-3">
                      <span className="pt-1 text-xs text-slate-500">{formatHour(hour)}</span>
                      <div className="min-h-8 rounded-2xl border border-white/5 bg-white/[0.015] p-2">
                        {hourTasks.length === 0 ? (
                          <div className="h-3 rounded-full bg-white/[0.02]" />
                        ) : (
                          <div className="space-y-2">
                            {hourTasks.map((task) => (
                              <motion.div
                                key={task.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm shadow-[0_0_24px_rgba(232,236,255,0.24)]"
                              >
                                <p className="font-medium">{task.title}</p>
                                <p className="text-xs text-slate-400">
                                  {task.scheduledTime} • {task.priority}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeView === "Focus" ? (
          <motion.section
            className="fixed inset-x-0 top-20 z-30 mx-auto w-[min(680px,92vw)] rounded-[2rem] border border-white/10 bg-black/60 p-8 backdrop-blur-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.45, ease }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Focus Mode</p>
            <p className="mt-3 text-2xl font-serif">{commitment}</p>
          </motion.section>
        ) : null}
      </AnimatePresence>

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
            onClick={() => setActiveView(item)}
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

function TaskLane({
  title,
  tasks,
  onEdit,
  onDelete,
  onComplete,
}: {
  title: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  return (
    <section className="space-y-3">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{title}</p>
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-5 text-sm text-slate-500">
            まだタスクはありません。
          </p>
        ) : (
          tasks.map((task) => (
            <motion.div
              key={task.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              drag="x"
              dragConstraints={{ left: 0, right: 90 }}
              dragElastic={0.08}
              onDragEnd={(_, info) => {
                if (info.offset.x > 72) {
                  onComplete(task.id);
                }
              }}
              whileHover={{ scale: 1.005 }}
            >
              <div className="absolute inset-y-2 right-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onComplete(task.id)}
                  className="rounded-full border border-emerald-200/40 bg-emerald-100/10 px-3 py-1 text-[10px] uppercase tracking-widest text-emerald-100 opacity-0 transition duration-300 group-hover:opacity-100"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-500"
                >
                  Delete
                </button>
              </div>
              <div className="px-4 py-4 pr-44 transition-transform duration-300 group-hover:-translate-x-8">
                <p className="text-base">{task.title}</p>
                {task.description ? (
                  <p className="mt-1 text-sm text-slate-400">{task.description}</p>
                ) : null}
                <p className={`mt-2 text-xs uppercase tracking-wider ${taskPriorityTone(task.priority)}`}>
                  {task.priority} • {task.scheduledTime}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}