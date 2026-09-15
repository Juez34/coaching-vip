"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { ArrowLeft, Loader2, Dumbbell, MessageSquare, Calendar, Clock, Check, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function WorkoutHistoryPage() {
  const params = useParams();
  const programId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [exercisesList, setExercisesList] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (programId) {
      fetchWorkoutHistory();
    }
  }, [programId]);

  const fetchWorkoutHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Récupérer le programme
      const { data: progData } = await supabase
        .from("programs")
        .select("*")
        .eq("id", programId)
        .maybeSingle();
      setProgram(progData);

      // 2. Récupérer les exercices du programme avec leur nombre de séries initial et leur ordre
      const { data: exData } = await supabase
        .from("exercises")
        .select("id, name, sets, order_index")
        .eq("program_id", programId)
        .order("order_index", { ascending: true });
      
      setExercisesList(exData || []);

      // 3. Récupérer les logs d'historique
      const { data: logsData } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("program_id", programId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setLogs(logsData || []);
    } catch (err) {
      console.error("Erreur :", err);
    } finally {
      setLoading(false);
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
      <Link href="/client" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour à mes séances</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
          Historique des performances
        </span>
        <h1 className="text-2xl font-black text-white mt-2">{program?.title || "Séance"}</h1>
        <p className="text-xs text-slate-400">
          {logs.length} session{logs.length > 1 ? "s" : ""} enregistrée{logs.length > 1 ? "s" : ""}
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
          Aucun historique trouvé pour cette session.
        </div>
      ) : (
        <div className="space-y-6">
          {logs.map((log, index) => {
            const performances = log.actual_performances || {};
            const completedSets = log.completed_sets || {};
            const exerciseComments = log.exercise_comments || {};

            return (
              <div key={log.id || index} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                {/* En-tête de session (Date & Durée) */}
                <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-800 text-xs gap-2">
                  <span className="font-black bg-emerald-400/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-400/20 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {log.created_at ? new Date(log.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Date inconnue"}
                  </span>
                  <span className="font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {Math.floor((log.duration_seconds || 0) / 60)} min
                  </span>
                </div>

                {/* Détail des exercices et de leurs séries */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                    <span>Détail des exercices</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {exercisesList.map((ex) => {
                      const exComment = exerciseComments[ex.id];
                      
                      return (
                        <div key={ex.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                            <span className="font-bold text-white text-xs">{ex.name}</span>
                          </div>

                          {/* Affichage de TOUTES les séries prévues (validées ou non) */}
                          <div className="space-y-1.5">
                            {Array.from({ length: ex.sets || 1 }).map((_, sIdx) => {
                              const key = `${ex.id}-${sIdx}`;
                              const isChecked = completedSets[key] === true;
                              const perf = performances[key] || {};

                              return (
                                <div 
                                  key={sIdx} 
                                  className={`flex justify-between items-center text-xs p-2 rounded-lg border ${
                                    isChecked 
                                      ? "bg-amber-400/5 border-amber-400/20" 
                                      : "bg-slate-900/50 border-slate-800/50 opacity-60"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {isChecked ? (
                                      <span className="p-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                                        <Check className="w-3 h-3" />
                                      </span>
                                    ) : (
                                      <span className="p-0.5 bg-slate-800 text-slate-500 rounded-full border border-slate-700">
                                        <X className="w-3 h-3" />
                                      </span>
                                    )}
                                    <span className="text-[11px] font-bold uppercase text-slate-400">Série {sIdx + 1}</span>
                                  </div>

                                  <span className={`font-mono font-bold px-2 py-0.5 rounded-md border text-xs ${
                                    isChecked 
                                      ? "text-amber-400 bg-amber-400/10 border-amber-400/20" 
                                      : "text-slate-500 bg-slate-900 border-slate-800"
                                  }`}>
                                    {isChecked ? `${perf.reps || "0"} reps @ ${perf.weight || "0"}` : "Non validée"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Commentaire spécifique à cet exercice s'il existe */}
                          {exComment && (
                            <p className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800 italic">
                              💬 Note exercice : "{exComment}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Commentaire global de la séance */}
                {log.student_comment && (
                  <div className="bg-amber-400/10 p-3 rounded-xl border border-amber-400/20 text-xs space-y-1">
                    <span className="font-bold text-amber-400 uppercase text-[10px] flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Commentaire global :
                    </span>
                    <p className="text-amber-200/90 italic">"{log.student_comment}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
