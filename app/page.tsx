"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;
const STORAGE_KEY = "aeterna.command-center.v3";
type ViewMode = "Zen" | "Today" | "ToDo" | "Calendar" | "Focus";
type CalendarSpan = "day" | "week" | "month" | "year";
type GoalMap = Record<CalendarSpan, string>;
type TodoItem = {
  id: string;
  title: string;
  scheduledTime: string;
  date: string;
  completed: boolean;
};
type AeternaState = {
  version: 3;
  activeView: ViewMode;
  zenCommitment: string;
  todayNote: string;
  todoDraft: string;
  todoTime: string;
  todoDate: string;
  todos: TodoItem[];
  calendarSpan: CalendarSpan;
  goals: GoalMap;
  focusNote: string;
  weekGoals: Record<string, string>;
  monthMilestones: Record<string, string>;
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const navItems: ViewMode[] = ["Zen", "Today", "ToDo", "Calendar", "Focus"];
const spans: CalendarSpan[] = ["day", "week", "month", "year"];
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const missionHours = Array.from({ length: 12 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTodoDate(todos: TodoItem[]): TodoItem[] {
  const today = toDateKey(new Date());
  return todos.map((todo) => {
    const legacy = todo as TodoItem & { time?: string; completed?: boolean };
    return {
      ...todo,
      date: todo.date ?? today,
      scheduledTime: todo.scheduledTime ?? legacy.time ?? "09:00",
      completed: Boolean(legacy.completed),
    };
  });
}

function buildMonthCells(baseDate: Date): Array<{ key: string; label: number; inMonth: boolean }> {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result: Array<{ key: string; label: number; inMonth: boolean }> = [];

  for (let i = 0; i < startWeekday; i += 1) {
    result.push({ key: `pad-start-${i}`, label: 0, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    result.push({
      key: toDateKey(new Date(year, month, day)),
      label: day,
      inMonth: true,
    });
  }

  while (result.length % 7 !== 0) {
    result.push({ key: `pad-end-${result.length}`, label: 0, inMonth: false });
  }
  return result;
}

function getDensityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function densityTone(level: 0 | 1 | 2 | 3 | 4): string {
  if (level === 0) return "bg-white/[0.02]";
  if (level === 1) return "bg-white/[0.04]";
  if (level === 2) return "bg-white/[0.06] shadow-[0_0_12px_rgba(236,240,255,0.2)]";
  if (level === 3) return "bg-white/[0.1] shadow-[0_0_16px_rgba(236,240,255,0.28)]";
  return "bg-white/[0.14] shadow-[0_0_22px_rgba(236,240,255,0.38)]";
}

function startOfWeekMonday(baseDate: Date): Date {
  const start = new Date(baseDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function closestHourFromPoint(
  pointY: number,
  slotRefs: Record<string, HTMLDivElement | null>,
): { hour: string; distance: number } | null {
  let closest: { hour: string; distance: number } | null = null;
  for (const [hour, element] of Object.entries(slotRefs)) {
    if (!element) continue;
    const rect = element.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const distance = Math.abs(pointY - centerY);
    if (!closest || distance < closest.distance) {
      closest = { hour, distance };
    }
  }
  return closest;
}

function readStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AeternaState;
    }

    const legacyRaw = window.localStorage.getItem("aeterna.command-center.v2");
    if (!legacyRaw) return null;
    const legacy = JSON.parse(legacyRaw) as Partial<AeternaState>;
    const migrated: AeternaState = {
      version: 3,
      activeView: legacy.activeView ?? "Zen",
      zenCommitment: legacy.zenCommitment ?? "この静寂の中で、最も重要な決断を下す。",
      todayNote: legacy.todayNote ?? "",
      todoDraft: legacy.todoDraft ?? "",
      todoTime: legacy.todoTime ?? "09:00",
      todoDate: legacy.todoDate ?? toDateKey(new Date()),
      todos: normalizeTodoDate((legacy.todos ?? []) as TodoItem[]),
      calendarSpan: legacy.calendarSpan ?? "day",
      goals: legacy.goals ?? { day: "", week: "", month: "", year: "" },
      focusNote: legacy.focusNote ?? "",
      weekGoals: legacy.weekGoals ?? {},
      monthMilestones: legacy.monthMilestones ?? {},
    };
    return migrated;
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
  const [todoDate, setTodoDate] = useState(initial?.todoDate ?? toDateKey(new Date()));
  const [todos, setTodos] = useState<TodoItem[]>(
    normalizeTodoDate(
      initial?.todos ?? [
        {
          id: "seed-1",
          title: "Board sync",
          scheduledTime: "09:00",
          date: toDateKey(new Date()),
          completed: false,
        },
        {
          id: "seed-2",
          title: "Deep work block",
          scheduledTime: "14:00",
          date: toDateKey(new Date()),
          completed: false,
        },
      ],
    ),
  );
  const [calendarSpan, setCalendarSpan] = useState<CalendarSpan>(initial?.calendarSpan ?? "day");
  const [goals, setGoals] = useState<GoalMap>(
    initial?.goals ?? { day: "", week: "", month: "", year: "" },
  );
  const [focusNote, setFocusNote] = useState(initial?.focusNote ?? "");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [draggingTodoId, setDraggingTodoId] = useState<string | null>(null);
  const [dragHoverHour, setDragHoverHour] = useState<string | null>(null);
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [weekGoals, setWeekGoals] = useState<Record<string, string>>(initial?.weekGoals ?? {});
  const [monthMilestones, setMonthMilestones] = useState<Record<string, string>>(
    initial?.monthMilestones ?? {},
  );
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoTitle, setEditingTodoTitle] = useState("");

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const payload: AeternaState = {
      version: 3,
      activeView,
      zenCommitment,
      todayNote,
      todoDraft,
      todoTime,
      todoDate,
      todos,
      calendarSpan,
      goals,
      focusNote,
      weekGoals,
      monthMilestones,
    };
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(payload),
    );
  }, [
    activeView,
    zenCommitment,
    todayNote,
    todoDraft,
    todoTime,
    todoDate,
    todos,
    calendarSpan,
    goals,
    focusNote,
    weekGoals,
    monthMilestones,
  ]);

  const timelineByHour = useMemo(() => {
    return hours.map((hour) => {
      const bucket = todos.filter(
        (todo) => !todo.completed && todo.scheduledTime.slice(0, 2) === hour.slice(0, 2),
      );
      return { hour, bucket };
    });
  }, [todos]);

  const nowDate = useMemo(() => new Date(nowMs), [nowMs]);
  const monthCells = useMemo(() => buildMonthCells(nowDate), [nowDate]);
  const tasksByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const todo of todos) {
      if (todo.completed) continue;
      map.set(todo.date, (map.get(todo.date) ?? 0) + 1);
    }
    return map;
  }, [todos]);

  const yearProgress = useMemo(() => {
    const currentYear = nowDate.getFullYear();
    const start = new Date(currentYear, 0, 1).getTime();
    const end = new Date(currentYear + 1, 0, 1).getTime();
    const clamped = Math.min(Math.max(nowMs, start), end);
    const ratio = (clamped - start) / (end - start);
    const remainingDays = Math.max(0, Math.ceil((end - clamped) / (1000 * 60 * 60 * 24)));
    return {
      year: currentYear,
      ratio,
      remainingDays,
    };
  }, [nowDate, nowMs]);

  const weekDays = useMemo(() => {
    const start = startOfWeekMonday(nowDate);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        key: toDateKey(date),
        label: `${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]} ${date.getDate()}`,
      };
    });
  }, [nowDate]);

  const yearMonthDensity = useMemo(() => {
    const counts = Array.from({ length: 12 }, () => 0);
    for (const todo of todos) {
      if (!todo.date.startsWith(`${yearProgress.year}-`)) continue;
      const month = Number(todo.date.slice(5, 7)) - 1;
      if (month >= 0 && month < 12) counts[month] += 1;
    }
    return counts;
  }, [todos, yearProgress.year]);

  function addTodo() {
    if (!todoDraft.trim()) return;
    setTodos((prev) => [
      {
        id: crypto.randomUUID(),
        title: todoDraft.trim(),
        scheduledTime: todoTime,
        date: todoDate,
        completed: false,
      },
      ...prev,
    ]);
    setTodoDraft("");
  }

  function deleteTodo(todoId: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
    if (editingTodoId === todoId) {
      setEditingTodoId(null);
      setEditingTodoTitle("");
    }
  }

  function toggleTodoCompleted(todoId: string) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }

  function startEditTodo(todo: TodoItem) {
    setEditingTodoId(todo.id);
    setEditingTodoTitle(todo.title);
  }

  function saveEditTodo(todoId: string) {
    const nextTitle = editingTodoTitle.trim();
    if (!nextTitle) return;
    setTodos((prev) =>
      prev.map((todo) => (todo.id === todoId ? { ...todo, title: nextTitle } : todo)),
    );
    setEditingTodoId(null);
    setEditingTodoTitle("");
  }

  function updateTodoSchedule(todoId: string, hour: string) {
    const today = toDateKey(new Date());
    const scheduledTime = `${hour.slice(0, 2)}:00`;
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              scheduledTime,
              date: today,
            }
          : todo,
      ),
    );
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
          <p className="text-xs text-slate-500">
            {nowDate.toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </p>
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
                <div className="mb-3 flex gap-2 overflow-auto pb-1">
                  {todos
                    .filter((todo) => !todo.completed)
                    .map((todo) => (
                    <motion.div
                      key={`draggable-${todo.id}`}
                      drag
                      dragMomentum={false}
                      dragElastic={0.02}
                      dragTransition={{ power: 0.03, timeConstant: 120 }}
                      dragSnapToOrigin
                      whileDrag={{
                        scale: 1.03,
                        backgroundColor: "rgba(255,255,255,0.15)",
                        borderColor: "rgba(255,255,255,0.35)",
                        boxShadow: "0 0 24px rgba(226,232,255,0.45)",
                        opacity: 0.88,
                      }}
                      onDragStart={() => setDraggingTodoId(todo.id)}
                      onDrag={(_, info) => {
                        const closest = closestHourFromPoint(info.point.y, slotRefs.current);
                        setDragHoverHour(closest?.distance && closest.distance < 85 ? closest.hour : null);
                      }}
                      onDragEnd={(_, info) => {
                        const closest = closestHourFromPoint(info.point.y, slotRefs.current);
                        if (closest && closest.distance < 85) {
                          updateTodoSchedule(todo.id, closest.hour);
                        }
                        setDraggingTodoId(null);
                        setDragHoverHour(null);
                      }}
                      className={`shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs backdrop-blur-lg touch-none ${
                        draggingTodoId === todo.id ? "text-ghost-white" : "text-slate-300"
                      }`}
                    >
                      {todo.title}
                    </motion.div>
                  ))}
                </div>
                {timelineByHour.map(({ hour, bucket }) => (
                  <div key={hour} className="grid grid-cols-[60px,1fr] items-center gap-2">
                    <span className="text-xs text-slate-500">{hour}</span>
                    <div
                      ref={(element) => {
                        slotRefs.current[hour] = element;
                      }}
                      className={`min-h-8 rounded-xl border px-3 py-1.5 transition ${
                        dragHoverHour === hour
                          ? "border-white/30 bg-white/[0.08] shadow-[0_0_22px_rgba(236,240,255,0.35)]"
                          : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      {bucket.length === 0 ? (
                        <div className="h-2 w-full rounded-full bg-white/[0.03]" />
                      ) : (
                        <div className="space-y-1">
                          {bucket.map((item) => (
                            <p
                              key={item.id}
                              className="rounded-lg border border-white/15 bg-white/[0.06] px-2 py-1 text-xs shadow-[0_0_16px_rgba(233,236,255,0.3)]"
                            >
                              {item.title} • {item.scheduledTime}
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
                <input
                  value={todoDate}
                  onChange={(event) => setTodoDate(event.target.value)}
                  type="date"
                    className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm outline-none sm:col-span-2"
                />
                <motion.button
                  type="button"
                  onClick={addTodo}
                  whileTap={{ scale: 0.95 }}
                  className="min-h-11 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs uppercase tracking-[0.2em]"
                >
                  Add
                </motion.button>
              </div>
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div key={todo.id} className="group rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <motion.button
                        type="button"
                        onClick={() => toggleTodoCompleted(todo.id)}
                        whileTap={{ scale: 0.95 }}
                        className="min-h-11 flex-1 text-left"
                      >
                        {editingTodoId === todo.id ? (
                          <input
                            value={editingTodoTitle}
                            onChange={(event) => setEditingTodoTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") saveEditTodo(todo.id);
                              if (event.key === "Escape") {
                                setEditingTodoId(null);
                                setEditingTodoTitle("");
                              }
                            }}
                            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
                            autoFocus
                          />
                        ) : (
                          <>
                            <p className={`text-sm ${todo.completed ? "text-slate-500 line-through" : "text-ghost-white"}`}>
                              {todo.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {todo.date} • {todo.scheduledTime}
                            </p>
                          </>
                        )}
                      </motion.button>
                      <div className="flex gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                        {editingTodoId === todo.id ? (
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => saveEditTodo(todo.id)}
                            className="min-h-11 min-w-11 rounded-xl border border-white/20 bg-white/10 px-3 text-sm"
                          >
                            ✓
                          </motion.button>
                        ) : (
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => startEditTodo(todo)}
                            className="min-h-11 min-w-11 rounded-xl border border-white/20 bg-white/10 px-3 text-sm"
                          >
                            ✎
                          </motion.button>
                        )}
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => deleteTodo(todo.id)}
                          className="min-h-11 min-w-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-slate-300"
                        >
                          ×
                        </motion.button>
                      </div>
                    </div>
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
                  <motion.button
                    key={span}
                    type="button"
                    onClick={() => setCalendarSpan(span)}
                    whileTap={{ scale: 0.95 }}
                    className={`min-h-11 flex-1 rounded-xl px-3 py-2 text-xs uppercase tracking-[0.2em] transition ${
                      calendarSpan === span ? "bg-white/10 text-ghost-white" : "text-slate-400"
                    }`}
                  >
                    {span}
                  </motion.button>
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

              {calendarSpan === "week" ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Daily Mission View</p>
                  <div className="grid gap-2 md:grid-cols-7">
                    {weekDays.map((day) => {
                      const dayTasks = todos.filter((todo) => todo.date === day.key);
                      return (
                        <div
                          key={day.key}
                          className="rounded-2xl border border-white/10 bg-white/[0.02] p-3"
                        >
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                            {day.label}
                          </p>
                          <input
                            value={weekGoals[day.key] ?? ""}
                            onChange={(event) =>
                              setWeekGoals((prev) => ({ ...prev, [day.key]: event.target.value }))
                            }
                            placeholder="Top goal"
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-2 py-1.5 text-xs outline-none placeholder:text-slate-500"
                          />
                          <div className="mt-3 space-y-1.5">
                            {dayTasks.length === 0 ? (
                              <p className="text-[11px] text-slate-500">No mission</p>
                            ) : (
                              dayTasks.map((todo) => (
                                <p
                                  key={todo.id}
                                  className="rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px]"
                                >
                                  {todo.scheduledTime} {todo.title}
                                </p>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : calendarSpan === "month" ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">This Month Density</p>
                  <div className="grid grid-cols-7 gap-2">
                    {monthCells.map((cell) => (
                      <div
                        key={cell.key}
                        className={`aspect-square rounded-lg border border-white/10 ${
                          cell.inMonth
                            ? densityTone(getDensityLevel(tasksByDate.get(cell.key) ?? 0))
                            : "bg-transparent opacity-40"
                        }`}
                        title={cell.inMonth ? `${cell.key} (${tasksByDate.get(cell.key) ?? 0} tasks)` : ""}
                      >
                        {cell.inMonth ? (
                          <span className="mt-1 block text-center text-[10px] text-slate-400">{cell.label}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : calendarSpan === "year" ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Executive Year • {yearProgress.year} Monthly Milestones
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {monthNames.map((month, index) => (
                        <div
                          key={month}
                          className="rounded-2xl border border-white/10 bg-white/[0.02] p-3"
                        >
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{month}</p>
                          <textarea
                            value={monthMilestones[String(index)] ?? ""}
                            onChange={(event) =>
                              setMonthMilestones((prev) => ({ ...prev, [String(index)]: event.target.value }))
                            }
                            placeholder="Milestone"
                            className="mt-2 h-14 w-full resize-none bg-transparent text-xs outline-none placeholder:text-slate-500"
                          />
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Array.from({
                              length: Math.max(1, Math.min(12, yearMonthDensity[index] === 0 ? 1 : yearMonthDensity[index] * 2)),
                            }).map((_, dotIndex) => (
                              <span
                                key={`${month}-dot-${dotIndex}`}
                                className={`h-1.5 w-1.5 rounded-full ${
                                  yearMonthDensity[index] === 0
                                    ? "bg-white/10"
                                    : yearMonthDensity[index] < 3
                                      ? "bg-white/30"
                                      : yearMonthDensity[index] < 6
                                        ? "bg-white/50 shadow-[0_0_8px_rgba(236,240,255,0.35)]"
                                        : "bg-white/70 shadow-[0_0_10px_rgba(236,240,255,0.5)]"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <ChronosHourglass
                    year={yearProgress.year}
                    progress={yearProgress.ratio}
                    remainingDays={yearProgress.remainingDays}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {missionHours.map((hour) => (
                    <div
                      key={hour}
                      className="grid grid-cols-[60px,1fr] items-center gap-2"
                    >
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
            className={`min-h-11 rounded-full px-7 py-2.5 text-[12px] tracking-[0.18em] transition-all duration-500 ${
              activeView === item
                ? "bg-white/10 text-ghost-white"
                : "text-slate-400 hover:text-ghost-white"
            }`}
            whileHover={{
              backgroundColor:
                activeView === item ? "rgba(255,255,255,0.11)" : "rgba(255,255,255,0.05)",
              y: -1,
            }}
            whileTap={{ scale: 0.95 }}
          >
            {item}
          </motion.button>
        ))}
      </motion.nav>
    </main>
  );
}

function ChronosHourglass({
  year,
  progress,
  remainingDays,
}: {
  year: number;
  progress: number;
  remainingDays: number;
}) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const topClipY = 32 + clamped * 58;
  const bottomClipY = 170 - clamped * 58;

  return (
    <div className="grid items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:grid-cols-[220px,1fr]">
      <svg viewBox="0 0 160 220" className="mx-auto w-40">
        <defs>
          <clipPath id="top-sand-clip">
            <motion.rect
              x="22"
              y={32}
              width="116"
              height="58"
              animate={{ y: topClipY, height: Math.max(2, 90 - topClipY) }}
              transition={{ duration: 1.4, ease }}
            />
          </clipPath>
          <clipPath id="bottom-sand-clip">
            <motion.rect
              x="22"
              y={bottomClipY}
              width="116"
              height={170 - bottomClipY}
              animate={{ y: bottomClipY, height: Math.max(2, 170 - bottomClipY) }}
              transition={{ duration: 1.4, ease }}
            />
          </clipPath>
        </defs>

        <polygon points="20,30 140,30 80,102" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <polygon points="20,190 140,190 80,118" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <polygon
          points="22,32 138,32 80,100"
          fill="rgba(233,236,255,0.24)"
          clipPath="url(#top-sand-clip)"
        />
        <polygon
          points="22,188 138,188 80,120"
          fill="rgba(233,236,255,0.36)"
          clipPath="url(#bottom-sand-clip)"
        />

        {Array.from({ length: 8 }, (_, i) => (
          <motion.circle
            key={`grain-${i}`}
            cx={80 + (i % 2 === 0 ? -1.5 : 1.5)}
            cy={106}
            r="1.2"
            fill="rgba(245,247,255,0.75)"
            animate={{ cy: [106, 114, 122], opacity: [0, 1, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.11, ease: "linear" }}
          />
        ))}
      </svg>

      <div>
        <p className="text-3xl font-thin tracking-wide text-ghost-white">
          {year} Progress: {`${(clamped * 100).toFixed(1)}%`}
        </p>
        <p className="mt-2 font-serif text-2xl text-slate-300">
          残り {remainingDays}日。君は何を成し遂げる？
        </p>
      </div>
    </div>
  );
}