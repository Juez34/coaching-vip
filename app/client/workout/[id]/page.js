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

  // Performances réelles saisies par l'élève : { [exerciseId_setIndex]: { reps, weight } }
  const [actualPerformances, setActualPerformances] = useState({});
  const [completedSets, setCompletedSets] = useState({});
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

      // Initialiser les valeurs par défaut avec les objectifs initiaux
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

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 mb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            Détails de la séance
          </span>
          <h1 className="text-2xl font-black text-white mt-2">{program?.title}</h1>
          {program?.coach_note && (
            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 mt-2">
              💡 <span className="font-bold text-amber-400">Note du coach :</span> {program.coach_note}
            </p>
          )}
        </div>

        {!isStarted ? (
          <button
            onClick={startWorkout}
            className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all mt-4"
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
            <div className="flex gap-2">
              <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs font-bold">
                {isTimerRunning ? "Pause" : "Reprendre"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LISTE DES EXERCICES (Modifiable si démarré) */}
      {isStarted && (
        <div className="space-y-4">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-base text-white">{ex.name}</h3>
              
              <div className="space-y-2">
                {Array.from({ length: ex.sets }).map((_, setIdx) => {
                  const key = `${ex.id}-${setIdx}`;
                  const isDone = completedSets[key];
                  const perf = actualPerformances[key] || {};

                  return (
                    <div key={setIdx} className={`p-3 rounded-xl border transition-all ${isDone ? "bg-amber-400/10 border-amber-400/50" : "bg-slate-950 border-slate-800"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-slate-400">Série {setIdx + 1}</span>
                        <button
                          onClick={() => toggleSetCheck(ex.id, setIdx)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${isDone ? "bg-amber-400 text-slate-950 border-amber-400" : "bg-slate-900 text-slate-400 border-slate-700"}`}
                        >
                          <Check className="w-3.5 h-3.5" /> {isDone ? "Validée" : "Valider"}
                        </button>
                      </div>

                      {/* Inputs modifiables pour poids et reps réels */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase text-slate-400 mb-0.5">Reps réalisées</label>
                          <input
                            type="text"
                            value={perf.reps}
                            onChange={(e) => handlePerfChange(ex.id, setIdx, "reps", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-white"
                            placeholder={ex.reps}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase text-slate-400 mb-0.5">Poids réel (kg)</label>
                          <input
                            type="text"
                            value={perf.weight}
                            onChange={(e) => handlePerfChange(ex.id, setIdx, "weight", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-white"
                            placeholder={ex.target_weight}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Commentaire de fin de séance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Commentaire pour le coach</span>
            </label>
            <textarea
              rows={2}
              value={studentComment}
              onChange={(e) => setStudentComment(e.target.value)}
              placeholder="Ex: Super séance, un peu dur sur la fin du développé couché..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white resize-none focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            onClick={handleFinishWorkout}
            disabled={saving}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 mt-6 transition-all"
          >
            <span>{saving ? "ENREGISTREMENT..." : "TERMINER ET ENVOYER AU COACH"}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
