"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { Check, ArrowLeft, Timer, Play, Loader2, ChevronRight, MessageSquare, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function WorkoutSessionPage() {
  // Récupération de l'ID du programme depuis l'URL dynamique
  const params = useParams();
  const programId = params?.id;

  // États principaux de la page
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState(null);
  const [exercises, setExercises] = useState([]);
  
  // États de l'exécution de la séance (Chrono et mode actif)
  const [isStarted, setIsStarted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // États pour stocker les performances, séries validées et commentaires de l'élève
  const [actualPerformances, setActualPerformances] = useState({});
  const [completedSets, setCompletedSets] = useState({});
  const [exerciseComments, setExerciseComments] = useState({});
  const [studentComment, setStudentComment] = useState("");

  // Chargement des données de la séance au montage du composant
  useEffect(() => {
    if (programId) fetchWorkout();
  }, [programId]);

  // Gestion du chronomètre de la séance
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => setTimerSeconds((p) => p + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Fonction utilitaire pour formater le temps en MM:SS
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Récupération du programme et de ses exercices depuis Supabase
  const fetchWorkout = async () => {
    try {
      setLoading(true);
      
      // 1. Charger les infos du programme
      const { data: prog } = await supabase.from("programs").select("*").eq("id", programId).single();
      setProgram(prog);

      // 2. Charger les exercices associés triés par ordre
      const { data: exList } = await supabase.from("exercises").select("*").eq("program_id", programId).order("order_index", { ascending: true });
      setExercises(exList || []);

      // 3. Initialiser les performances par défaut avec les objectifs initiaux du coach
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
      console.error("Erreur lors du chargement de la séance :", err);
    } finally {
      setLoading(false);
    }
  };

  // Déclenchement du démarrage de la séance et du chrono
  const startWorkout = () => {
    setIsStarted(true);
    setIsTimerRunning(true);
  };

  // Basculer l'état validé/non validé d'une série spécifique
  const toggleSetCheck = (exId, setIdx) => {
    if (!isStarted) return;
    const key = `${exId}-${setIdx}`;
    setCompletedSets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Mettre à jour les répétitions ou le poids réel d'une série
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

  // Enregistrer le commentaire de l'élève pour un exercice précis
  const handleExerciseCommentChange = (exId, value) => {
    setExerciseComments((prev) => ({
      ...prev,
      [exId]: value
    }));
  };

  // Sauvegarde finale de la séance dans la table workout_logs
  const handleFinishWorkout = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Structuration des données de performance pour compatibilité avec l'affichage de l'historique
      const formattedPerformances = exercises.map((ex) => {
        const setsData = [];
        
        for (let i = 0; i < ex.sets; i++) {
          const key = `${ex.id}-${i}`;
          const perf = actualPerformances[key] || {};
          const isDone = !!completedSets[key];

          setsData.push({
            set_index: i + 1,
            reps: perf.reps || ex.reps || "-",
            weight: perf.weight || ex.target_weight || null,
            completed: isDone
          });
        }

        return {
          exercise_id: ex.id,
          name: ex.name,
          comment: exerciseComments[ex.id] || null,
          sets: setsData
        };
      });

      // Insertion dans Supabase
      const { error } = await supabase.from("workout_logs").insert([
        {
          program_id: programId,
          user_id: user.id,
          duration_seconds: timerSeconds,
          completed_sets: completedSets,
          actual_performances: formattedPerformances,
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

        {!isStarted ? (
          <button
            onClick={startWorkout}
            className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
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
            <button 
              onClick={() => setIsTimerRunning(!isTimerRunning)} 
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer"
            >
              {isTimerRunning ? "Pause" : "Reprendre"}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Dumbbell className="w-4 h-4 text-amber-400" />
          <span>Aperçu des exercices ({exercises.length})</span>
        </h2>

        {exercises.map((ex, idx) => (
          <div key={ex.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400">{idx + 1}.</span>
                <h3 className="font-bold text-sm text-white">{ex.name}</h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {ex.sets} séries • {ex.reps} reps {ex.target_weight ? `• ${ex.target_weight} kg` : ""}
              </span>
            </div>

            {ex.coach_comment && (
              <p className="text-[11px] text-amber-300/90 bg-amber-400/10 px-2.5 py-1.5 rounded-lg border border-amber-400/20 italic">
                💡 {ex.coach_comment}
              </p>
            )}

            {isStarted && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                {Array.from({ length: ex.sets }).map((_, setIdx) => {
                  const key = `${ex.id}-${setIdx}`;
                  const isDone = completedSets[key];
                  const perf = actualPerformances[key] || {};

                  return (
                    <div key={setIdx} className={`p-2.5 rounded-lg border transition-all ${isDone ? "bg-amber-400/10 border-amber-400/50" : "bg-slate-950 border-slate-800"}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase text-slate-400">Série {setIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => toggleSetCheck(ex.id, setIdx)}
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 border transition-colors cursor-pointer ${isDone ? "bg-amber-400 text-slate-950 border-amber-400" : "bg-slate-900 text-slate-400 border-slate-700"}`}
                        >
                          <Check className="w-3 h-3" /> {isDone ? "Validée" : "Valider"}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            value={perf.reps}
                            onChange={(e) => handlePerfChange(ex.id, setIdx, "reps", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-md py-1 px-2 text-xs text-white focus:outline-none focus:border-amber-400"
                            placeholder={`Reps (${ex.reps})`}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={perf.weight}
                            onChange={(e) => handlePerfChange(ex.id, setIdx, "weight", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2 text-xs text-white focus:outline-none focus:border-amber-400"
                            placeholder={`Poids (${ex.target_weight || "0"})`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Commentaire sur cet exercice (ex: bonnes sensations...)"
                    onChange={(e) => handleExerciseCommentChange(ex.id, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

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
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
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
