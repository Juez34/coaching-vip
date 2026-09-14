"use client";
import React, { useState, useEffect, use } from "react";
import { supabase } from "../../../../lib/supabase";
import { Check, ArrowLeft, Timer, Pause, Play, RotateCcw, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function DedicatedWorkoutPage({ params }) {
  const resolvedParams = use(params);
  const programId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [completedSets, setCompletedSets] = useState({});

  // Chronomètre
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    fetchWorkoutDetails();
  }, [programId]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const fetchWorkoutDetails = async () => {
    try {
      setLoading(true);

      // 1. Programme
      const { data: progData, error: progErr } = await supabase
        .from("programs")
        .select("*")
        .eq("id", programId)
        .single();

      if (progErr) throw progErr;
      setProgram(progData);

      // 2. Exercices
      const { data: exData, error: exErr } = await supabase
        .from("exercises")
        .select("*")
        .eq("program_id", programId)
        .order("order_index", { ascending: true });

      if (exErr) throw exErr;
      setExercises(exData || []);
    } catch (err) {
      alert("Erreur de chargement de la séance : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSet = (exerciseId, setIndex) => {
    const key = `${exerciseId}-${setIndex}`;
    setCompletedSets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinishWorkout = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("workout_logs").insert([
        {
          program_id: programId,
          completed_sets: completedSets,
          duration_seconds: timerSeconds,
          user_id: user.id
        }
      ]);

      if (error) throw error;

      alert(`Bravo ! Séance terminée en ${formatTime(timerSeconds)} 🎉`);
      window.location.href = "/client";
    } catch (err) {
      alert("Erreur lors de la validation : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-2xl mx-auto pb-24">
      {/* Retour */}
      <Link href="/client" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-4">
        <ArrowLeft className="w-4 h-4" />
        <span>Quitter la séance</span>
      </Link>

      {/* Titre & Note */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white">{program?.title}</h1>
        {program?.coach_note && (
          <p className="text-xs text-amber-400 bg-amber-400/10 p-3 rounded-xl border border-amber-400/20 mt-2">
            💡 {program.coach_note}
          </p>
        )}
      </div>

      {/* CHRONO FLOTTANT / SUPERIEUR */}
      <div className="sticky top-4 z-40 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-2xl font-black font-mono text-white">{formatTime(timerSeconds)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="p-2 bg-slate-800 text-white rounded-xl border border-slate-700"
          >
            {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>
          <button
            onClick={() => { setTimerSeconds(0); setIsTimerRunning(false); }}
            className="p-2 bg-slate-950 text-slate-400 rounded-xl border border-slate-800"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* LISTE DES EXERCICES */}
      <div className="space-y-4">
        {exercises.map((ex) => (
          <div key={ex.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div>
              <h3 className="font-bold text-base text-white">{ex.name}</h3>
              <p className="text-xs text-slate-400">
                Cible : <span className="text-amber-400 font-semibold">{ex.target_weight}</span> • {ex.reps} reps
              </p>
            </div>

            <div className="space-y-2">
              {Array.from({ length: ex.sets }).map((_, setIdx) => {
                const isDone = completedSets[`${ex.id}-${setIdx}`];
                return (
                  <div
                    key={setIdx}
                    onClick={() => toggleSet(ex.id, setIdx)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      isDone
                        ? "bg-amber-400/10 border-amber-400/50 text-amber-300"
                        : "bg-slate-950/60 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase">Série {setIdx + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs">{ex.reps} reps @ {ex.target_weight}</span>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                        isDone ? "bg-amber-400 border-amber-400 text-slate-950" : "border-slate-700 bg-slate-900"
                      }`}>
                        {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* BOUTON DE VALIDATION FINALE */}
      <button
        onClick={handleFinishWorkout}
        disabled={saving}
        className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 mt-8 active:scale-95 transition-all"
      >
        <span>{saving ? "ENREGISTREMENT..." : "TERMINER LA SÉANCE"}</span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
