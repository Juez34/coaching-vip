"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Check, Flame, Play, Dumbbell, Calendar, User, Loader2, Search, UserCheck, LogOut, ChevronRight } from "lucide-react";

export default function StudentWorkout() {
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedSets, setCompletedSets] = useState({});

  const [coachQuery, setCoachQuery] = useState("");
  const [coaches, setCoaches] = useState([]);
  const [showCoachSearch, setShowCoachSearch] = useState(false);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const searchCoach = async (query) => {
    setCoachQuery(query);
    if (query.length < 2) return setCoaches([]);

    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "coach")
      .ilike("id", `%${query}%`);

    setCoaches(data || []);
  };

  const selectCoach = async (coachId) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return alert("Connecte-toi pour enregistrer ton coach.");

    const { error } = await supabase
      .from("profiles")
      .update({ coach_id: coachId })
      .eq("id", user.user.id);

    if (error) {
      alert("Erreur lors de la sélection du coach.");
    } else {
      alert("Ton coach a été enregistré !");
      window.location.reload();
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
      alert("Séance enregistrée avec succès !");
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-6xl mx-auto pb-20">
      {/* En-tête identique aux espaces Coach et Admin */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 shadow-sm inline-block mb-2">
            ESPACE ÉLÈVE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {workout ? workout.title : "Mon Programme"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Suivi de tes séances et entraînements.</p>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2 transition-colors shrink-0"
          title="Déconnexion"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </header>

      {/* Contenu de la séance optimisé mobile (max-w-md centré) */}
      {!workout ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-14 h-14 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-center justify-center mb-4">
            <Dumbbell className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold mb-2 text-white">Aucun programme assigné</h2>
          <p className="text-xs text-slate-400 mb-6">
            Ton coach n'a pas encore publié de séance pour ton profil, ou tu n'as pas encore sélectionné ton coach.
          </p>

          <button
            onClick={() => setShowCoachSearch(!showCoachSearch)}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all mb-4"
          >
            <UserCheck className="w-4 h-4" />
            <span>Trouver mon Coach</span>
          </button>

          {showCoachSearch && (
            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-left">
              <label className="block text-xs font-bold uppercase text-slate-400">
                Rechercher ton coach (ID)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Tape l'ID de ton coach..."
                  value={coachQuery}
                  onChange={(e) => searchCoach(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {coaches.map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-xs font-mono text-slate-300 truncate max-w-[180px]">{c.id}</span>
                    <button
                      onClick={() => selectCoach(c.id)}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-md"
                    >
                      Sélectionner
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <main className="space-y-5 max-w-md mx-auto">
          {workout.coachNote && (
            <div className="text-xs text-slate-300 bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex gap-2.5 items-start">
              <span className="text-base leading-none">💡</span>
              <div>
                <span className="font-bold text-amber-400">Note du coach : </span>
                {workout.coachNote}
              </div>
            </div>
          )}

          {workout.exercises.map((ex) => (
            <div key={ex.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-base text-white tracking-tight">{ex.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Objectif : <span className="text-amber-400 font-semibold">{ex.target_weight}</span> • {ex.reps} reps
                  </p>
                </div>
                <button className="p-2 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 rounded-xl text-amber-400 transition-colors">
                  <Play className="w-4 h-4 fill-amber-400" />
                </button>
              </div>

              <div className="space-y-2">
                {Array.from({ length: ex.sets }).map((_, setIdx) => {
                  const isDone = completedSets[`${ex.id}-${setIdx}`];
                  return (
                    <div
                      key={setIdx}
                      onClick={() => toggleSet(ex.id, setIdx)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                        isDone
                          ? "bg-amber-400/10 border-amber-400/50 text-amber-300"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">Série {setIdx + 1}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-400">{ex.reps} reps @ {ex.target_weight}</span>
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                            isDone
                              ? "bg-amber-400 border-amber-400 text-slate-950"
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
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-6"
          >
            <span>TERMINER LA SÉANCE</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </main>
      )}
    </div>
  );
}
