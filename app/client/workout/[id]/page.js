"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { Check, ArrowLeft, Timer, Pause, Play, RotateCcw, Loader2, ChevronRight, MessageSquare, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function WorkoutSessionPage() {
  const params = useParams();
  const programId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState(null);
  const [exercises, setExercises] = useState([]);
  
  // État de la session active
  const [isStarted, setIsStarted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Performances et commentaires
  const [actualPerformances, setActualPerformances] = useState({});
  const [completedSets, setCompletedSets] = useState({});
  const [exerciseComments, setExerciseComments] = useState({});
  const [studentComment, setStudentComment] = useState("");

  useEffect(() => {
    if (programId) fetchWorkout();
  }, [programId]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => setTimerSeconds((p) => p + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const fetchWorkout = async () => {
    try {
      setLoading(true);
      const { data: prog } = await supabase.from("programs").select("*").eq("id", programId).single();
      setProgram(prog);

      const { data: exList } = await supabase.from("exercises").select("*").eq("program_id", programId).order("order_index", { ascending: true });
      setExercises(exList || []);

      const initialPerf = {};
      (exList || []).forEach((ex) => {
        for (let i = 0; i < ex.sets; i++) {
          initialPerf[`${ex.id}-${i}`] = {
            reps: ex.reps || "",
            weight: ex.target_weight || ""
          };
        }
      });
      setActualPerformances(initialPerf);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = () => {
    setIsStarted(true);
    setIsTimerRunning(true);
  };

  const toggleSetCheck = (exId, setIdx) => {
    if (!isStarted) return; // Empêche de valider si la séance n'est pas lancée
    const key = `${exId}-${setIdx}`;
    setCompletedSets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePerfChange = (exId, setIdx, field, value) => {
    const key = `${exId}-${setIdx}`;
    setActualPerformances((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value
      }
    }));
  };

  const handleExerciseCommentChange = (exId, value) => {
    setExerciseComments((prev) => ({
      ...prev,
      [exId]: value
    }));
  };

  const handleFinishWorkout = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("workout_logs").insert([
        {
          program_id: programId,
          user_id: user.id,
          duration_seconds: timerSeconds,
          completed_sets: completedSets,
          actual_performances: actualPerformances,
          exercise_comments: exerciseComments,
          student_comment: studentComment,
          status: "completed"
        }
      ]);

      if (error) throw error;
      alert("Séance enregistrée avec succès ! 💪");
      window.location.href = "/client";
    } catch (err) {
      alert("Erreur lors de l'enregistrement : " + err.message);
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
      <Link href="/client" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-4">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux séances</span>
      </Link>

      {/* En-tête et Résumé de la séance */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 mb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            Aperçu de la séance
          </span>
          <h1 className="text-2xl font-black text-white mt-2">{program?.title}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {exercises.length} exercice{exercises.length > 1 ? "s" : ""} prévu{exercises.length > 1 ? "s" : ""}
          </p>

          {program?.coach_note && (
            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 mt-3">
              💡 <span className="font-bold text-amber-400">Note du coach :</span> {program.coach_note}
            </p>
          )}
        </div>

        {/* Bouton de démarrage ou Chrono actif */}
        {!isStarted ? (
          <button
            onClick={startWorkout}
            className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all mt-2"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>COMMENCER L'ENTRAÎNEMENT</span>
          </button>
        ) : (
          <div className="bg-slate-950 border border-amber-400/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-2xl font-black font-mono text-white">{formatTime(timerSeconds)}</span>
            </div>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs font-bold text-white">
              {isTimerRunning ? "Pause" : "Reprendre"}
            </button>
          </div>
        )}
      </div>

      {/* APERÇU / LISTE DES EXERCICES (Toujours visible, mais interactif uniquement si démarré) */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Dumbbell className="w-4 h-4 text-amber-400" />
          <span>Programme des exercices</span>
        </h2>

        {exercises.map((ex) => (
          <div key={ex.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div>
              <h3 className="font-bold text-base text-white">{ex.name}</h3>
              {ex.coach_comment && (
                <p className="text-[11px] text-amber-300 bg-amber-400/10 p-2 rounded-lg border border-amber-400/20 italic mt-1.5">
                  💡 Consigne coach : {ex.coach_comment}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {Array.from({ length: ex.sets }).map((_, setIdx) => {
                const key = `${ex.id}-${setIdx}`;
                const isDone = completedSets[key];
                const perf = actualPerformances[key] || {};

                return (
                  <div key={setIdx} className={`p-3 rounded-xl border transition-all ${isDone ? "bg-amber-400/10 border-amber-400/50" : "bg-slate-950 border-slate-800"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-slate-400">Série {setIdx + 1}</span>
                      
                      {/* Le bouton de validation n'est cliquable que si la séance est lancée */}
                      <button
                        type="button"
                        onClick={() => toggleSetCheck(ex.id, setIdx)}
                        disabled={!isStarted}
                        className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                          !isStarted 
                            ? "opacity-50 cursor-not-allowed bg-slate-900 text-slate-500 border-slate-800" 
                            : isDone 
                              ? "bg-amber-400 text-slate-950 border-amber-400" 
                              : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> {isDone ? "Validée" : "Valider"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase text-slate-400 mb-0.5">Reps (Objectif : {ex.reps})</label>
                        <input
                          type="text"
                          value={perf.reps}
                          disabled={!isStarted}
                          onChange={(e) => handlePerfChange(ex.id, setIdx, "reps", e.target.value)}
                          className={`w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-white ${!isStarted ? "opacity-60 cursor-not-allowed" : ""}`}
                          placeholder={ex.reps}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase text-slate-400 mb-0.5">Poids (Objectif : {ex.target_weight})</label>
                        <input
                          type="text"
                          value={perf.weight}
                          disabled={!isStarted}
                          onChange={(e) => handlePerfChange(ex.id, setIdx, "weight", e.target.value)}
                          className={`w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-white ${!isStarted ? "opacity-60 cursor-not-allowed" : ""}`}
                          placeholder={ex.target_weight}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Commentaire par exercice */}
            <div className="pt-1">
              <input
                type="text"
                placeholder={isStarted ? "Commentaire sur cet exercice..." : "Démarrez la séance pour commenter"}
                disabled={!isStarted}
                onChange={(e) => handleExerciseCommentChange(ex.id, e.target.value)}
                className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400 ${!isStarted ? "opacity-50 cursor-not-allowed" : ""}`}
              />
            </div>
          </div>
        ))}

        {/* Section de fin de séance (visible uniquement si démarré) */}
        {isStarted && (
          <div className="space-y-4 pt-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Commentaire global pour le coach</span>
              </label>
              <textarea
                rows={2}
                value={studentComment}
                onChange={(e) => setStudentComment(e.target.value)}
                placeholder="Ex: Super séance, un peu de fatigue sur la fin..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white resize-none focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={handleFinishWorkout}
              disabled={saving}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all"
            >
              <span>{saving ? "ENREGISTREMENT..." : "TERMINER ET ENVOYER AU COACH"}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
