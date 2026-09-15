"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { ArrowLeft, Loader2, CheckCircle2, Calendar, Clock, History, Dumbbell, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function WorkoutHistoryPage() {
  const params = useParams();
  const programId = params?.id;

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
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

      // 1. Récupérer les détails du programme
      const { data: progData } = await supabase
        .from("programs")
        .select("*")
        .eq("id", programId)
        .single();

      setProgram(progData);

      // 2. Récupérer tous les logs (historique) de ce programme pour cet utilisateur, triés par date décroissante
      const { data: logsData } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("program_id", programId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setLogs(logsData || []);
    } catch (err) {
      console.error("Erreur de chargement de l'historique :", err);
    } finally {
      setLoading(false);
    }
  };

  // Formatage de la date en français
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
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
      {/* Bouton de retour */}
      <Link href="/client" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour à mes séances</span>
      </Link>

      {/* En-tête de la page d'historique */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
          Historique des performances
        </span>
        <h1 className="text-2xl font-black text-white mt-2">{program?.title || "Séance"}</h1>
        <p className="text-xs text-slate-400 mt-1">
          {logs.length} session{logs.length > 1 ? "s" : ""} réalisée{logs.length > 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Liste des sessions passées */}
      {logs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
          Aucun historique enregistré pour cette séance.
        </div>
      ) : (
        <div className="space-y-6">
          {logs.map((log, index) => {
            const sessionNumber = logs.length - index;
            return (
              <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                {/* Infos de la session (Date & Durée) */}
                <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-800 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-emerald-400/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-400/20">
                      Session #{sessionNumber}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {Math.floor((log.duration_seconds || 0) / 60)} min
                  </span>
                </div>

                {/* Performances réelles par série */}
                {log.actual_performances && Object.keys(log.actual_performances).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                      <span>Performances enregistrées</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(log.actual_performances).map(([key, perf], i) => (
                        <div key={i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                          <span className="text-slate-400">Série {i + 1}</span>
                          <span className="font-bold text-white">
                            {perf.reps || 0} reps @ {perf.weight || "0"} kg
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Commentaire par exercice */}
                {log.exercise_comments && Object.keys(log.exercise_comments).length > 0 && (
                  <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Notes par exercice :</span>
                    {Object.entries(log.exercise_comments).map(([exId, comment], i) => (
                      <p key={i} className="text-slate-400 italic text-[11px]">
                        • {comment}
                      </p>
                    ))}
                  </div>
                )}

                {/* Commentaire global de fin de séance */}
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
