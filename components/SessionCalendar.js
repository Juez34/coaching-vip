"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthGrid, localDateKey } from "../lib/sessionCalendar";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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

export default function SessionCalendar({ events }) {
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1, 12));
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(today));
  const days = useMemo(() => getMonthGrid(month.getFullYear(), month.getMonth()), [month]);
  const eventsByDay = useMemo(() => {
    const grouped = new Map();
    for (const event of events) {
      const key = localDateKey(event.date);
      if (!key) continue;
      grouped.set(key, [...(grouped.get(key) || []), event]);
    }
    for (const dayEvents of grouped.values()) {
      dayEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    return grouped;
  }, [events]);
  const selectedEvents = eventsByDay.get(selectedDate) || [];

  const moveMonth = (amount) => {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + amount, 1, 12);
    setMonth(nextMonth);
    setSelectedDate(localDateKey(nextMonth));
  };

  return (
    <section className="space-y-4" aria-label="Calendrier des séances">
      <p className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs leading-relaxed text-slate-400">
        Le calendrier affiche les dates disponibles : création d’un programme et réalisation d’une séance. Les programmes ne contiennent pas encore de date planifiée.
      </p>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button type="button" onClick={() => moveMonth(-1)} className="rounded-lg border border-slate-800 p-2 text-slate-300 hover:text-amber-400" aria-label="Mois précédent">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-bold capitalize text-white">
            {month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </h3>
          <button type="button" onClick={() => moveMonth(1)} className="rounded-lg border border-slate-800 p-2 text-slate-300 hover:text-amber-400" aria-label="Mois suivant">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1" role="grid" aria-label={month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}>
          {WEEKDAYS.map((day) => <div key={day} role="columnheader" className="py-2 text-center text-[10px] font-bold uppercase text-slate-500">{day}</div>)}
          {days.map((day) => {
            const key = localDateKey(day);
            const dayEvents = eventsByDay.get(key) || [];
            const inMonth = day.getMonth() === month.getMonth();
            return (
              <div key={key} role="gridcell">
              <button
                type="button"
                aria-label={`${day.toLocaleDateString("fr-FR", { dateStyle: "full" })}, ${dayEvents.length} événement${dayEvents.length > 1 ? "s" : ""}`}
                aria-pressed={selectedDate === key}
                onClick={() => {
                  setSelectedDate(key);
                  if (!inMonth) setMonth(new Date(day.getFullYear(), day.getMonth(), 1, 12));
                }}
                className={`min-h-12 w-full rounded-lg border p-1 text-center text-xs transition-colors sm:min-h-14 ${selectedDate === key ? "border-amber-400 bg-amber-400/10 text-amber-300" : "border-transparent hover:border-slate-700"} ${inMonth ? "text-slate-200" : "text-slate-600"}`}
              >
                <span>{day.getDate()}</span>
                {dayEvents.length > 0 && <span className="mx-auto mt-1 flex w-fit items-center gap-0.5" aria-hidden="true">
                  {dayEvents.slice(0, 3).map((event) => <span key={event.id} className={`h-1.5 w-1.5 rounded-full ${event.kind === "completed" ? "bg-emerald-400" : "bg-amber-400"}`} />)}
                  {dayEvents.length > 3 && <span className="text-[9px]">+</span>}
                </span>}
              </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-400" />Programme créé</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-400" />Séance réalisée</span>
        </div>
      </div>

      <div className="space-y-2" aria-live="polite">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          <CalendarDays className="h-4 w-4 text-amber-400" />
          {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </h3>
        {selectedEvents.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-500">Aucun événement enregistré ce jour-là.</p>
        ) : selectedEvents.map((event) => (
          <Link key={event.id} href={event.href} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-amber-400/50">
            <span>
              <span className="block text-sm font-bold text-white">{event.title}</span>
              <span className={`mt-1 block text-[10px] font-bold uppercase ${event.kind === "completed" ? "text-emerald-400" : "text-amber-400"}`}>{event.label}</span>
              <span className="mt-1 block text-[10px] text-slate-500">
                {new Date(event.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
          </Link>
        ))}
      </div>
    </section>
  );
}
