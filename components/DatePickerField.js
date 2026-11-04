"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthGrid, localDateKey } from "../lib/sessionCalendar";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

export default function DatePickerField({ id, label = "Date prévue", value, onChange, placeholder = "Choisir une date" }) {
  const containerRef = useRef(null);
  const initialDate = value ? new Date(`${value}T12:00:00`) : new Date();
  const [month, setMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1, 12));
  const [open, setOpen] = useState(false);
  const days = useMemo(() => getMonthGrid(month.getFullYear(), month.getMonth()), [month]);

  useEffect(() => {
    if (!value) return;
    const date = new Date(`${value}T12:00:00`);
    if (!Number.isNaN(date.getTime())) setMonth(new Date(date.getFullYear(), date.getMonth(), 1, 12));
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  const moveMonth = (amount) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1, 12));
  const chooseDate = (date) => {
    onChange(localDateKey(date));
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={value ? `${label} : ${new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR", { dateStyle: "full" })}` : `${label} : ${placeholder}`}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-left text-xs text-white transition-colors hover:border-amber-400 focus:border-amber-400 focus:outline-none"
      >
        <span className={value ? "" : "text-slate-500"}>{value ? new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR", { dateStyle: "long" }) : placeholder}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-amber-400" />
      </button>

      {open && (
        <div role="dialog" aria-label="Choisir une date" className="absolute left-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-slate-700 bg-slate-900 p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button type="button" aria-label="Mois précédent" onClick={() => moveMonth(-1)} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-amber-300"><ChevronLeft className="h-4 w-4" /></button>
            <h3 className="text-sm font-bold capitalize text-white">{month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h3>
            <button type="button" aria-label="Mois suivant" onClick={() => moveMonth(1)} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-amber-300"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1" role="grid">
            {WEEKDAYS.map((day, index) => <span key={`${day}-${index}`} className="py-1 text-center text-[10px] font-bold text-slate-500">{day}</span>)}
            {days.map((date) => {
              const key = localDateKey(date);
              const isSelected = key === value;
              const isCurrentMonth = date.getMonth() === month.getMonth();
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={date.toLocaleDateString("fr-FR", { dateStyle: "full" })}
                  aria-pressed={isSelected}
                  onClick={() => chooseDate(date)}
                  className={`aspect-square rounded-lg text-xs font-semibold transition-colors ${isSelected ? "bg-amber-400 text-slate-950" : isCurrentMonth ? "text-slate-200 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-800 hover:text-slate-300"}`}
                >{date.getDate()}</button>
              );
            })}
          </div>
          <button type="button" onClick={() => chooseDate(new Date())} className="mt-3 w-full rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-slate-800">Aujourd’hui</button>
        </div>
      )}
    </div>
  );
}
