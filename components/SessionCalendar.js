"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { getMonthGrid, localDateKey } from "../lib/sessionCalendar";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const CALENDAR_MODES = [
  { id: "month", label: "Mois" },
  { id: "week", label: "Semaine" },
  { id: "day", label: "Jour" },
];

export function SessionViewToggle({ view, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1" role="group" aria-label="Mode d’affichage des séances">
      {[{ id: "list", label: "Liste" }, { id: "calendar", label: "Calendrier" }].map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={view === option.id}
          onClick={() => onChange(option.id)}
          className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${view === option.id ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function startOfWeek(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function dateTitle(date, options) {
  return date.toLocaleDateString("fr-FR", options);
}

function ResultSummary({ log, exercises }) {
  const completed = log.completed_sets || {};
  let rawPerformances = log.actual_performances || [];
  if (typeof rawPerformances === "string") {
    try { rawPerformances = JSON.parse(rawPerformances); } catch { rawPerformances = []; }
  }
  const performanceList = Array.isArray(rawPerformances) ? rawPerformances : null;
  const totalSets = (exercises || []).reduce((sum, exercise) => sum + Number(exercise.sets || 1), 0);
  const duration = Number(log.duration_seconds || 0);
  const bestSets = [];
  for (const exercise of exercises || []) {
    const savedExercise = performanceList?.find((item) => String(item.exercise_id) === String(exercise.id) || item.name === exercise.name);
    for (let index = 0; index < Number(exercise.sets || 1); index += 1) {
      const savedSet = savedExercise?.sets?.[index] || {};
      const isCompleted = completed[`${exercise.id}-${index}`] === true || savedSet.completed === true;
      if (!isCompleted) continue;
      const legacyPerformance = !performanceList ? rawPerformances[`${exercise.id}-${index}`] || {} : {};
      bestSets.push({
        key: `${exercise.id}-${index}`,
        label: exercise.name || "Série",
        value: [savedSet.reps || legacyPerformance.reps ? `${savedSet.reps || legacyPerformance.reps} reps` : null, savedSet.weight || legacyPerformance.weight ? `${savedSet.weight || legacyPerformance.weight} kg` : null].filter(Boolean).join(" · "),
        set: index + 1,
      });
    }
  }
  const completedCount = bestSets.length || Object.values(completed).filter(Boolean).length;

  return (
    <div className="mt-3 rounded-lg border border-emerald-400/15 bg-emerald-400/5 p-2.5" aria-label="Résultats de la séance">
      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-300">
        Résultats · {completedCount}/{totalSets || completedCount} séries
        {duration >= 60 ? ` · ${Math.floor(duration / 60)} min` : duration > 0 ? ` · ${duration} s` : ""}
      </p>
      {bestSets.length > 0 && (
        <ul className="mt-1.5 space-y-1 text-[11px] text-slate-300">
          {bestSets.map((set) => <li key={set.key} className="truncate"><span className="text-white">{set.label}</span> · Série {set.set}{set.value && ` · ${set.value}`}</li>)}
        </ul>
      )}
      {log.student_comment && <p className="mt-1.5 line-clamp-2 text-[11px] italic text-slate-400">« {log.student_comment} »</p>}
    </div>
  );
}

function SessionCard({ event, isCoach }) {
  const completed = event.kind === "completed";
  const exercises = event.exercises || [];
  return (
    <Link href={event.href} className={`block min-w-0 rounded-xl border p-3 transition-colors hover:border-amber-400/50 ${completed ? "border-emerald-400/20 bg-slate-900" : "border-amber-400/20 bg-slate-900"}`}>
      <div className="flex min-w-0 items-start gap-2">
        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${completed ? "bg-emerald-400" : "bg-amber-400"}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-white sm:text-sm">{event.title}</p>
          <p className={`mt-0.5 text-[10px] font-bold uppercase ${completed ? "text-emerald-400" : "text-amber-300"}`}>{completed ? "Réalisée" : "Prévue"}{event.date && ` · ${new Date(event.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}</p>
        </div>
      </div>

      {exercises.length > 0 && (
        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-400">
          <Dumbbell className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
          <span className="line-clamp-2">{exercises.map((exercise) => `${exercise.name}${exercise.sets ? ` (${exercise.sets}×${exercise.reps || "…"})` : ""}`).join(" · ")}</span>
        </div>
      )}

      {isCoach && completed && event.log && <ResultSummary log={event.log} exercises={exercises} />}
    </Link>
  );
}

export default function SessionCalendar({ events, isCoach = false }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(today));
  const [mode, setMode] = useState("month");
  const selected = new Date(`${selectedDate}T12:00:00`);
  const month = new Date(selected.getFullYear(), selected.getMonth(), 1, 12);
  const monthDays = useMemo(() => getMonthGrid(month.getFullYear(), month.getMonth()), [month.getFullYear(), month.getMonth()]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = startOfWeek(selected);
    date.setDate(date.getDate() + index);
    return date;
  }), [selectedDate]);
  const eventsByDay = useMemo(() => {
    const grouped = new Map();
    for (const event of events) {
      const key = localDateKey(event.date);
      if (!key) continue;
      grouped.set(key, [...(grouped.get(key) || []), event]);
    }
    for (const dayEvents of grouped.values()) dayEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    return grouped;
  }, [events]);
  const selectedEvents = eventsByDay.get(selectedDate) || [];

  const movePeriod = (amount) => {
    const next = new Date(selected);
    if (mode === "month") next.setMonth(next.getMonth() + amount);
    if (mode === "week") next.setDate(next.getDate() + amount * 7);
    if (mode === "day") next.setDate(next.getDate() + amount);
    setSelectedDate(localDateKey(next));
  };
  const goToday = () => setSelectedDate(localDateKey(new Date()));
  const heading = mode === "month"
    ? dateTitle(selected, { month: "long", year: "numeric" })
    : mode === "week"
      ? `${dateTitle(weekDays[0], { day: "numeric", month: "short" })} – ${dateTitle(weekDays[6], { day: "numeric", month: "short", year: "numeric" })}`
      : dateTitle(selected, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const renderMonth = () => (
    <div className="grid grid-cols-7 gap-1" role="grid" aria-label={heading}>
      {WEEKDAYS.map((day) => <div key={day} role="columnheader" className="py-2 text-center text-[10px] font-bold uppercase text-slate-500">{day}</div>)}
      {monthDays.map((day) => {
        const key = localDateKey(day);
        const dayEvents = eventsByDay.get(key) || [];
        const inMonth = day.getMonth() === month.getMonth();
        return (
          <div key={key} role="gridcell" className="min-w-0">
            <button
              type="button"
              aria-label={`${dateTitle(day, { dateStyle: "full" })}, ${dayEvents.length} événement${dayEvents.length > 1 ? "s" : ""}`}
              aria-pressed={selectedDate === key}
              onClick={() => setSelectedDate(key)}
              className={`flex min-h-[5.25rem] w-full flex-col items-stretch gap-1 rounded-lg border p-1 text-left text-xs transition-colors sm:min-h-28 sm:p-1.5 ${selectedDate === key ? "border-amber-400 bg-amber-400/10" : "border-transparent hover:border-slate-700"} ${inMonth ? "text-slate-200" : "text-slate-600"}`}
            >
              <span className={`self-center font-semibold ${selectedDate === key ? "text-amber-300" : ""}`}>{day.getDate()}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                {dayEvents.slice(0, 2).map((event) => <span key={event.id} title={event.title} className={`block w-full truncate rounded px-1 py-0.5 text-[8px] font-semibold leading-tight sm:text-[10px] ${event.kind === "completed" ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-200"}`}>{event.title}</span>)}
                {dayEvents.length > 2 && <span className="text-center text-[8px] text-slate-400 sm:text-[10px]">+{dayEvents.length - 2}</span>}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderDay = (day, compact = false) => {
    const key = localDateKey(day);
    const dayEvents = eventsByDay.get(key) || [];
    return (
      <section key={key} className="min-w-0 space-y-2" aria-label={dateTitle(day, { dateStyle: "full" })}>
        <h4 className="border-b border-slate-800 pb-2 text-xs font-bold uppercase tracking-wide text-slate-300 sm:text-sm">{dateTitle(day, { weekday: "long", day: "numeric", month: "long" })}</h4>
        {dayEvents.length ? <div className={`grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>{dayEvents.map((event) => <SessionCard key={event.id} event={event} isCoach={isCoach} />)}</div> : <p className="rounded-xl border border-dashed border-slate-800 p-4 text-xs text-slate-500">Aucune séance prévue ou réalisée.</p>}
      </section>
    );
  };

  return (
    <section className="space-y-4" aria-label="Calendrier des séances">
      <p className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs leading-relaxed text-slate-400">
        Les séances prévues apparaissent à leur date programmée. Les séances réalisées apparaissent à leur date de réalisation.
      </p>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <button type="button" onClick={() => movePeriod(-1)} className="rounded-lg border border-slate-800 p-2 text-slate-300 hover:text-amber-400" aria-label="Période précédente"><ChevronLeft className="h-4 w-4" /></button>
            <h3 className="min-w-0 text-center text-sm font-bold capitalize text-white">{heading}</h3>
            <button type="button" onClick={() => movePeriod(1)} className="rounded-lg border border-slate-800 p-2 text-slate-300 hover:text-amber-400" aria-label="Période suivante"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button type="button" onClick={goToday} className="rounded-lg border border-slate-800 px-3 py-2 text-[11px] font-bold text-slate-300 hover:border-amber-400/50 hover:text-amber-300">Aujourd’hui</button>
            <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1" role="group" aria-label="Vue du calendrier">
              {CALENDAR_MODES.map((option) => <button key={option.id} type="button" aria-pressed={mode === option.id} onClick={() => setMode(option.id)} className={`rounded-lg px-2.5 py-2 text-[11px] font-bold transition-colors sm:px-3 ${mode === option.id ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"}`}>{option.label}</button>)}
            </div>
          </div>
        </div>

        {mode === "month" && renderMonth()}
        {mode === "week" && (
          <div className="overflow-x-auto pb-2" aria-label="Semaine, une colonne par jour">
            <div className="grid min-w-[840px] grid-cols-7 gap-2">
              {weekDays.map((day) => renderDay(day, true))}
            </div>
          </div>
        )}
        {mode === "day" && renderDay(selected)}

        {mode === "month" && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-400" />Séance prévue</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-400" />Séance réalisée</span>
          </div>
        )}
      </div>

      {mode === "month" && (
        <div className="space-y-2" aria-live="polite">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400"><CalendarDays className="h-4 w-4 text-amber-400" />{dateTitle(selected, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h3>
          {selectedEvents.length === 0 ? <p className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-500">Aucun événement enregistré ce jour-là.</p> : selectedEvents.map((event) => <SessionCard key={event.id} event={event} isCoach={isCoach} />)}
        </div>
      )}
    </section>
  );
}
