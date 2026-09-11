"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Check, Flame, Play, ChevronRight, Dumbbell, Calendar, User, Loader2 } from "lucide-react";
import Link from "next/link";

export default function StudentWorkout() {
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedSets, setCompletedSets] = useState({});

  useEffect(() => {
    fetchWorkoutData();
  }, []);

  const fetchWorkoutData = async () => {
    try {
      setLoading(true);
      const { data: programData, error: programError } = await supabase
        .from("programs")
        .select("*")
        .limit(1)
        .single();

      if (programError && programError.code !== "PGRST116") {
        console.error("Erreur programme:", programError);
      }

      if (programData) {
        const { data: exercisesData } = await supabase
          .from("exercises")
          .select("*")
          .eq("program_id", programData.id)
          .order("order_index", { ascending: true });

        setWorkout({
          id: programData.id,
          title: programData.title,
          coachNote: programData.coach_note,
          exercises: exercisesData || []
        });
      }
    } catch (err) {
      console.error("Erreur de chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSet = (exerciseId, setIndex) => {
    const key = `${exerciseId}-${setIndex}`;
    setCompletedSets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveWorkout = async () => {
    if (!workout) return;
    
    try {
      const { error } = await supabase.from("workout_logs").insert([
        {
          program_id: workout.id,
          completed_sets: completedSets
        }
      ]);

      if (error) throw error;
      alert("Séance enregistrée avec succès dans la base de données !");
    } catch (err) {
      alert("Erreur lors de l'enregistrement de la séance.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-amber-400/10 border border-amber-400/20 rounded-full flex items-center justify-center mb-4">
          <Dumbbell className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-xl font-bold mb-2">Aucun programme assigné</h1>
        <p className="text-sm text-slate-400 max-w-xs">
          Ton coach n'a pas encore publié de séance pour ton profil. Reviens très vite !
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      <header className="px-6 pt-8 pb-6 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-10 backdrop-blur-md bg-slate-900/90">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-extrabold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 shadow-sm">
            COACHING VIP
          </span>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span>En direct</span>
          </div>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">{workout.title}</h1>
        {workout.coachNote && (
          <div className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 mt-3 flex gap-2 items-start">
            <span className="text-base leading-none">💡</span>
            <div>
              <span className="font-bold text-amber-400">Note du coach : </span>
              {workout.coachNote}
            </div>
          </div>
        )}
      </header>

      <main className="px-4 pt-6 space-y-6 max-w-md mx-auto">
        {workout.exercises.map((ex) => (
          <div key={ex.id} className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-white tracking-tight">{ex.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Objectif : <span className="text-amber-400 font-semibold">{ex.target_weight}</span> • {ex.reps} reps
                </p>
              </div>
              <button className="p-2.5 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 rounded-xl text-amber-400 transition-colors">
                <Play className="w-4 h-4 fill-amber-400" />
              </button>
            </div>

            <div className="space-y-2.5">
              {Array.from({ length: ex.sets }).map((_, setIdx) => {
                const isDone = completedSets[`${ex.id}-${setIdx}`];
                return (
                  <div
                    key={setIdx}
                    onClick={() => toggleSet(ex.id, setIdx)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                      isDone
                        ? "bg-amber-400/10 border-amber-400/50 text-amber-300 shadow-inner"
                        : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">Série {setIdx + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-400">{ex.reps} reps @ {ex.target_weight}</span>
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isDone
                            ? "bg-amber-400 border-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                            : "border-slate-700 bg-slate-900"
                        }`}
                      >
                        {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={saveWorkout}
          className="w-full mt-8 py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-400/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>TERMINER LA SÉANCE</span>
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800/80 px-6 py-3 backdrop-blur-lg flex justify-around items-center max-w-md mx-auto">
        <button className="flex flex-col items-center gap-1 text-amber-400">
          <Dumbbell className="w-5 h-5" />
          <span className="text-[10px] font-bold">Séance</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300">
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-medium">Planning</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300">
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profil</span>
        </button>
      </nav>
    </div>
  );
}
